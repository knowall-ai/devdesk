import { describe, it, expect } from 'vitest';
import { layoutWrapper } from './email-templates';

describe('layoutWrapper footer', () => {
  const html = layoutWrapper('<p>body</p>');

  it('always credits KnowAll AI in text', () => {
    expect(html).toContain('Powered by');
    expect(html).toContain('KnowAll AI');
    expect(html).toContain('https://knowall.ai');
  });

  it('renders no KnowAll image when no logo URL is configured', () => {
    // KNOWALL_LOGO_URL is unset in the test environment. Emitting an <img>
    // anyway put a blank 120x30 gap into every outbound customer email, or a
    // broken-image icon when the asset 404s.
    expect(html).not.toContain('alt="KnowAll AI"');
    expect(html).not.toContain('src=""');
  });

  it('still shows the ZapDesk logo, which is shipped', () => {
    expect(html).toContain('/email/zapdesk-logo.png');
  });

  it('wraps the content it was given', () => {
    expect(html).toContain('<p>body</p>');
  });

  it('produces a complete document', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
  });
});
