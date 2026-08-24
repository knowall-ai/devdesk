/**
 * Utility functions for @mention handling
 */

/**
 * One name token: starts and ends with a word character, and may carry dots,
 * hyphens or apostrophes inside — "Jane.Smith", "O'Neill", "Al-Rashid".
 */
const NAME_TOKEN = String.raw`[\w](?:[\w.\-']*[\w])?`;

/**
 * A mention is `@` plus a name token, then at most two further tokens that
 * each begin with a capital.
 *
 * The capital is what ends the mention. `MentionInput` inserts a bare
 * `@Display Name ` with no delimiter after it, so nothing in the stored text
 * marks where the name stops — matching spaces greedily made
 * "@Jane Doe please review this" highlight the whole sentence. Requiring the
 * continuation to look like part of a name stops at the first ordinary word.
 *
 * The cost is a lowercase surname ("@jane doe") highlighting only "@jane",
 * which is the safer way to be wrong: too little highlight, never a
 * swallowed sentence.
 */
const MENTION_PATTERN = String.raw`@${NAME_TOKEN}(?:[ ](?=[A-Z])${NAME_TOKEN}){0,2}`;

/**
 * What must sit in front of an `@` for it to start a mention: the start of the
 * string, whitespace, or a tag boundary — so "jane@example.com" isn't one.
 * Shared by both functions; if they disagree, a name can highlight without
 * being notified.
 */
const MENTION_PREFIX = String.raw`(^|[\s>])`;

/** Class applied to the span wrapping a highlighted mention. */
export const MENTION_CLASS = 'mention';

/**
 * Highlights @mentions in HTML content by wrapping them in span elements
 * Matches @username patterns where username can contain letters, numbers, spaces, and dots
 * @param html - The HTML content to process
 * @returns HTML with mentions wrapped in styled spans
 */
export function highlightMentions(html: string): string {
  if (!html) return html;

  const mentionRegex = new RegExp(String.raw`${MENTION_PREFIX}(${MENTION_PATTERN})`, 'g');

  return html.replace(mentionRegex, (_match, prefix, mention) => {
    // Escape HTML in the mention text for safety
    const escapedMention = escapeHtml(mention);
    return `${prefix}<span class="${MENTION_CLASS}">${escapedMention}</span>`;
  });
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Extracts all mentions from a text string
 * @param text - The text to extract mentions from
 * @returns Array of mentioned usernames (without @)
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];

  // Exactly the boundary highlightMentions uses. It previously accepted only
  // start-of-string or whitespace, so "<p>@Jane Doe hi</p>" highlighted the
  // name but extracted nothing and the mentioned user was never notified.
  const mentionRegex = new RegExp(String.raw`${MENTION_PREFIX}(${MENTION_PATTERN})`, 'g');
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[2].slice(1));
  }

  return [...new Set(mentions)]; // Remove duplicates
}
