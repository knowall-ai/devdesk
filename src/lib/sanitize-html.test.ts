// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeUserHtml, htmlToPlainText } from './sanitize-html';

describe('sanitizeUserHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeUserHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('strips inline event handlers — the reported vector', () => {
    const out = sanitizeUserHtml('<img src=x onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('alert');
  });

  it('strips event handlers from otherwise allowed tags', () => {
    const out = sanitizeUserHtml('<p onclick="steal()">click</p>');
    expect(out).toBe('<p>click</p>');
  });

  it('drops javascript: URLs but keeps the link text', () => {
    const out = sanitizeUserHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('click');
  });

  it('keeps http, mailto and proxy-relative links', () => {
    expect(sanitizeUserHtml('<a href="https://example.com">x</a>')).toContain(
      'href="https://example.com"'
    );
    expect(sanitizeUserHtml('<a href="mailto:someone@example.com">x</a>')).toContain('mailto:');
    expect(sanitizeUserHtml('<img src="/api/devops/attachments/abc">')).toContain(
      'src="/api/devops/attachments/abc"'
    );
  });

  it('forces links to open safely', () => {
    const out = sanitizeUserHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('preserves the formatting DevOps actually emits', () => {
    const html =
      '<div><b>bold</b> <i>italic</i><ul><li>one</li></ul>' +
      '<table><tbody><tr><td colspan="2">cell</td></tr></tbody></table></div>';
    expect(sanitizeUserHtml(html)).toBe(html);
  });

  it('keeps inline style but drops class', () => {
    const out = sanitizeUserHtml('<span style="color: red" class="btn-primary">x</span>');
    expect(out).toContain('style');
    expect(out).not.toContain('btn-primary');
  });

  it('keeps the text inside a stripped tag', () => {
    expect(sanitizeUserHtml('<marquee>still readable</marquee>')).toContain('still readable');
  });

  it('removes iframes and forms outright', () => {
    expect(sanitizeUserHtml('<iframe src="https://evil.test"></iframe>')).toBe('');
    const out = sanitizeUserHtml('<form action="/x"><input name="p"></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeUserHtml('')).toBe('');
    expect(sanitizeUserHtml(null)).toBe('');
    expect(sanitizeUserHtml(undefined)).toBe('');
  });
});

describe('sanitizeUserHtml with mentions', () => {
  it('wraps a mention in prose', () => {
    const out = sanitizeUserHtml('<p>ping @bob please</p>', { mentions: true });
    expect(out).toBe('<p>ping <span class="mention">@bob</span> please</p>');
  });

  it('matches a two-word display name', () => {
    const out = sanitizeUserHtml('<p>@John Doe took it</p>', { mentions: true });
    expect(out).toContain('<span class="mention">@John Doe</span>');
  });

  it('does not run past the name into the rest of the sentence', () => {
    const out = sanitizeUserHtml('<p>@bob and everyone else should look</p>', { mentions: true });
    expect(out).toContain('<span class="mention">@bob</span>');
    expect(out).toContain('and everyone else should look');
  });

  it('leaves attribute values alone — the markup-matching defect', () => {
    const out = sanitizeUserHtml('<p title="ask @bob about it">text</p>', { mentions: true });
    expect(out).toContain('title="ask @bob about it"');
    expect(out).not.toContain('<span class="mention">@bob</span>');
  });

  it('does not rewrite inside links or code', () => {
    expect(sanitizeUserHtml('<a href="/x">@bob</a>', { mentions: true })).not.toContain('mention');
    expect(sanitizeUserHtml('<code>@bob</code>', { mentions: true })).not.toContain('mention');
  });

  it('handles several mentions in one text node', () => {
    const out = sanitizeUserHtml('<p>@ann and @ben</p>', { mentions: true });
    expect(out).toBe(
      '<p><span class="mention">@ann</span> and <span class="mention">@ben</span></p>'
    );
  });

  it('still sanitises when mentions are on', () => {
    const out = sanitizeUserHtml('<p>@bob</p><script>alert(1)</script>', { mentions: true });
    expect(out).not.toContain('script');
    expect(out).toContain('mention');
  });

  it('treats a mention-shaped injection as text', () => {
    const out = sanitizeUserHtml('<p>@bob<script>alert(1)</script></p>', { mentions: true });
    expect(out).not.toContain('alert');
  });
});

describe('htmlToPlainText', () => {
  it('strips markup', () => {
    expect(htmlToPlainText('<p>hello <b>world</b></p>')).toBe('hello world');
  });

  it('decodes entities rather than showing them raw', () => {
    expect(htmlToPlainText('<p>Tom &amp; Jerry</p>')).toBe('Tom & Jerry');
  });

  it('collapses whitespace', () => {
    expect(htmlToPlainText('<p>a</p>\n\n   <p>b</p>')).toBe('a b');
  });

  it('truncates on the text length, not the markup length', () => {
    // Short text, long markup: the old caller measured the HTML and added an
    // ellipsis the content had not earned.
    const html = '<div style="color:red;font-size:12px;padding:4px">short</div>';
    expect(htmlToPlainText(html, 200)).toBe('short');
  });

  it('appends an ellipsis when it really does truncate', () => {
    expect(htmlToPlainText(`<p>${'x'.repeat(50)}</p>`, 10)).toBe(`${'x'.repeat(10)}…`);
  });

  it('returns empty for empty input', () => {
    expect(htmlToPlainText(null)).toBe('');
  });
});

describe('URL handling', () => {
  it('keeps non-URL attributes that a URL pattern would reject', () => {
    // Regression: applying a URL allowlist to every attribute stripped these.
    const html =
      '<table><tbody><tr><td colspan="2" rowspan="3" align="left">c</td></tr></tbody></table>';
    expect(sanitizeUserHtml(html)).toBe(html);
    expect(sanitizeUserHtml('<img src="/api/devops/attachments/a" width="80" alt="x">')).toContain(
      'width="80"'
    );
  });

  it('rejects a protocol smuggled past a control character', () => {
    const out = sanitizeUserHtml('<a href="java\tscript:alert(1)">x</a>');
    expect(out).not.toContain('script:');
  });

  it('rejects vbscript and non-image data URLs', () => {
    expect(sanitizeUserHtml('<a href="vbscript:msgbox(1)">x</a>')).not.toContain('vbscript');
    expect(sanitizeUserHtml('<img src="data:text/html;base64,PHN2Zz4=">')).not.toContain(
      'data:text/html'
    );
  });

  it('keeps a base64 image, which DevOps pastes inline', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeUserHtml(`<img src="${png}">`)).toContain(png);
  });
});
