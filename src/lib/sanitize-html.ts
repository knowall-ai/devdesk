import DOMPurify from 'dompurify';
import { highlightMentionsIn } from './mentions';

/**
 * Sanitise work item HTML before it reaches the DOM.
 *
 * Azure DevOps stores descriptions, repro steps, resolutions and comments as
 * HTML, so ZapDesk has to render markup rather than text — which makes every
 * render site an injection sink. Anyone who can comment on a work item in the
 * org could otherwise run script in the browser of anyone who opens that
 * ticket here; `<img src=x onerror=…>` is enough (issue #413).
 *
 * The allowlist below is deliberately shaped around what the DevOps rich-text
 * editor actually produces. Anything outside it is dropped rather than
 * escaped, so a stripped tag leaves its text content behind instead of
 * showing raw markup to the reader.
 *
 * This runs in the browser only. Every caller is a client component whose
 * content arrives from a client-side fetch, so these branches never render
 * during SSR — see `sanitizeUserHtml` for the server-side fallback.
 */

/** Tags the DevOps editor emits, plus the table markup it pastes. */
const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

/**
 * `style` is allowed because DevOps inlines colours and alignment on spans and
 * table cells, and dropping it mangles pasted content.
 *
 * DOMPurify does *not* help here: it is an HTML sanitiser, not a CSS one, and
 * passes the declaration list through untouched. `sanitizeStyle` below does
 * that half of the job.
 *
 * `class` is *not* allowed: our own stylesheet gives meaning to class names,
 * and letting comment authors set them would let them borrow UI chrome they
 * should not have.
 */
const ALLOWED_ATTR = [
  'align',
  'alt',
  'colspan',
  'dir',
  'height',
  'href',
  'rel',
  'rowspan',
  'src',
  'style',
  'target',
  'title',
  'width',
];

const CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Keep the text of a stripped tag: a dropped <script> should vanish, but a
  // dropped <font> should not take the sentence inside it with it.
  KEEP_CONTENT: true,
  // Reject anything that tries to break out of the fragment.
  FORBID_TAGS: ['form', 'input', 'button', 'iframe', 'object', 'embed', 'script', 'style', 'link'],
  FORBID_ATTR: ['srcset', 'formaction', 'form', 'ping'],
};

/**
 * Protocols a link or image may use.
 *
 * Checked in a hook rather than through DOMPurify's `ALLOWED_URI_REGEXP`,
 * which is applied to *every* attribute value — setting it there quietly
 * dropped `colspan="2"`, `width` and `align` from pasted tables, because a
 * table span is not a URL and never matches a URL pattern.
 */
const SAFE_URI = /^(?:https?:|mailto:|tel:|data:image\/(?:png|jpe?g|gif|webp);base64,|[/#])/i;

/** Attributes whose value is fetched or navigated to. */
const URI_ATTRS = ['href', 'src'] as const;

/**
 * Declarations dropped from an inline `style`.
 *
 * DOMPurify is an HTML sanitiser and leaves CSS alone, so this is ours to do.
 * Nothing here executes script in a current browser — the risks are quieter:
 *
 * - `url(…)` fetches. A `background-image` pointing at an attacker's host turns
 *   opening a ticket into a beacon that reports who read it and when, from
 *   inside an authenticated session. `expression()` and `-moz-binding` did
 *   execute, in browsers no longer in service; they are cheap to keep out.
 * - `position: fixed|absolute` lifts an element out of the comment and lets it
 *   cover the page — an overlay over the real controls, drawn by someone whose
 *   only privilege is commenting on a work item.
 *
 * Everything the DevOps editor actually emits — colours, fonts, alignment,
 * spacing, borders, cell widths — is untouched by this.
 */
const UNSAFE_DECLARATION =
  /(?:^|[\s;])(?:position\s*:\s*(?:fixed|absolute)|[^;]*(?:url\s*\(|expression\s*\(|-moz-binding))/i;

/**
 * Drop the dangerous declarations from an inline `style`, keeping the rest.
 *
 * Splitting on `;` is enough because the declarations that survive are simple
 * property/value pairs; anything containing a function call that could hide a
 * `;` is exactly what gets dropped.
 *
 * @param value The raw `style` attribute value.
 * @returns The value with unsafe declarations removed — empty if none survive.
 */
function sanitizeStyle(value: string): string {
  const kept = value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration.length > 0 && !UNSAFE_DECLARATION.test(declaration));

  return kept.length > 0 ? `${kept.join('; ')};` : '';
}

let hooked = false;

/**
 * Install the attribute pass DOMPurify does not do for us.
 *
 * Three jobs, all on attributes DOMPurify has already decided to keep:
 *
 * - Reject `href`/`src` values whose protocol is not on {@link SAFE_URI}.
 * - Strip the dangerous declarations from inline `style` — see
 *   {@link UNSAFE_DECLARATION}, since DOMPurify does not read CSS.
 * - Force every surviving link to open safely. `target="_blank"` without
 *   `rel="noopener"` hands the opened page a live `window.opener` reference
 *   back to ZapDesk, and DevOps content routinely carries `target`, so rather
 *   than dropping it we normalise it.
 *
 * Idempotent: the hook is registered once per module instance.
 */
function installHooks(): void {
  if (hooked) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    for (const attr of URI_ATTRS) {
      const value = node.getAttribute?.(attr);
      if (value === null || value === undefined) continue;
      // Strip control characters first: a tab inside "java<TAB>script:" is
      // still javascript: once the browser parses the URL.
      const normalised = value.replace(/[\u0000-\u0020]/g, '');
      if (!SAFE_URI.test(normalised)) node.removeAttribute(attr);
    }
    const style = node.getAttribute?.('style');
    if (style) {
      const safe = sanitizeStyle(style);
      if (safe) node.setAttribute('style', safe);
      else node.removeAttribute('style');
    }
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
  hooked = true;
}

/** Strip every tag, leaving only text. The server-side fallback. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Reduce work item HTML to plain text, for previews and truncation.
 *
 * Callers used to do this with `html.replace(/<[^>]*>/g, '')` and then feed
 * the result *back* into `dangerouslySetInnerHTML` — which left entities
 * showing raw and re-opened the sink for anything the regex missed. Text
 * belongs in a text node, so this returns a string to render as a child.
 */
export function htmlToPlainText(html: string | null | undefined, maxLength?: number): string {
  if (!html) return '';
  const stripped = stripTags(html);

  let text: string;
  if (typeof window === 'undefined') {
    text = stripped;
  } else {
    // Let the browser decode entities — &amp;, &nbsp; and friends.
    const holder = document.createElement('textarea');
    holder.innerHTML = stripped;
    text = holder.value || '';
  }
  text = text.replace(/\s+/g, ' ').trim();

  // Measured against the text, not the markup. The previous caller compared
  // the *HTML* length against the limit, so a short description wrapped in
  // long markup was given an ellipsis it had not earned.
  if (maxLength !== undefined && text.length > maxLength) {
    return `${text.slice(0, maxLength).trimEnd()}…`;
  }
  return text;
}

export interface SanitizeOptions {
  /** Wrap `@mentions` in `<span class="mention">`. Comments only. */
  mentions?: boolean;
}

/**
 * Sanitise a fragment of work item HTML for rendering.
 *
 * Returns markup safe to pass to `dangerouslySetInnerHTML`. On the server —
 * where there is no DOM for DOMPurify to work against — it degrades to plain
 * text rather than trusting the input.
 */
export function sanitizeUserHtml(
  html: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (!html) return '';
  if (typeof window === 'undefined') return stripTags(html);
  installHooks();

  if (!options.mentions) {
    return DOMPurify.sanitize(html, CONFIG) as unknown as string;
  }

  // Mentions are applied to the sanitised DOM rather than to the string, so
  // the pattern only ever sees prose — never attribute values (issue #413).
  const fragment = DOMPurify.sanitize(html, {
    ...CONFIG,
    RETURN_DOM_FRAGMENT: true,
  }) as unknown as DocumentFragment;

  highlightMentionsIn(fragment);

  const holder = document.createElement('div');
  holder.appendChild(fragment);
  return holder.innerHTML;
}
