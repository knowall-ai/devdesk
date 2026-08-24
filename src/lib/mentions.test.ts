import { describe, it, expect } from 'vitest';
import { highlightMentions, extractMentions } from './mentions';

/** The span the comment view renders around a mention. */
const span = (name: string) => `<span class="mention">@${name}</span>`;

describe('highlightMentions — where a mention ends', () => {
  // MentionInput inserts a bare "@Display Name " with no delimiter, so the
  // stored text carries no marker for where the name stops. Matching spaces
  // greedily highlighted the rest of the sentence (#138 review).
  it('stops at the first ordinary word after the name', () => {
    expect(highlightMentions('@Jane Doe please review this')).toBe(
      `${span('Jane Doe')} please review this`
    );
  });

  it('highlights a single-word mention', () => {
    expect(highlightMentions('@Jane please review')).toBe(`${span('Jane')} please review`);
  });

  it('handles a dotted display name', () => {
    expect(highlightMentions('@Jane.Smith can you look')).toBe(
      `${span('Jane.Smith')} can you look`
    );
  });

  it('handles apostrophes and hyphens inside a name', () => {
    expect(highlightMentions("@Ciara O'Neill thanks")).toBe(`${span('Ciara O&#39;Neill')} thanks`);
    expect(highlightMentions('@Sara Al-Rashid thanks')).toBe(`${span('Sara Al-Rashid')} thanks`);
  });

  it('takes at most three name words', () => {
    expect(highlightMentions('@Mary Jane Watson Smith')).toBe(`${span('Mary Jane Watson')} Smith`);
  });

  it('stops at punctuation', () => {
    expect(highlightMentions('@Jane Doe, thanks')).toBe(`${span('Jane Doe')}, thanks`);
    expect(highlightMentions('cc @Jane Doe.')).toBe(`cc ${span('Jane Doe')}.`);
  });

  it('highlights every mention in a line', () => {
    expect(highlightMentions('@Jane Doe and @Bob Smith please sync')).toBe(
      `${span('Jane Doe')} and ${span('Bob Smith')} please sync`
    );
  });
});

describe('highlightMentions — what is not a mention', () => {
  it('leaves an email address alone', () => {
    expect(highlightMentions('mail me at jane@example.com')).toBe('mail me at jane@example.com');
  });

  it('leaves empty input alone', () => {
    expect(highlightMentions('')).toBe('');
  });

  // The result is injected with dangerouslySetInnerHTML, so surrounding markup
  // is passed through by design; only the matched mention text is escaped, and
  // the apostrophe case above exercises that.
  it('leaves surrounding markup untouched and does not extend into a tag', () => {
    expect(highlightMentions('@Jane<script>')).toBe(`${span('Jane')}<script>`);
    expect(highlightMentions('<b>hi</b> @Jane Doe')).toBe(`<b>hi</b> ${span('Jane Doe')}`);
  });

  it('matches after a tag boundary as well as whitespace', () => {
    expect(highlightMentions('<p>@Jane Doe hi</p>')).toBe(`<p>${span('Jane Doe')} hi</p>`);
  });
});

describe('extractMentions', () => {
  // Highlighting and notifying have to agree — a name that lights up in the
  // comment is the name the notification goes to.
  it('extracts the name without the trailing sentence', () => {
    expect(extractMentions('@Jane Doe please review this')).toEqual(['Jane Doe']);
  });

  it('extracts several mentions and de-duplicates', () => {
    expect(extractMentions('@Jane Doe and @Bob Smith and @Jane Doe again')).toEqual([
      'Jane Doe',
      'Bob Smith',
    ]);
  });

  it('ignores an email address', () => {
    expect(extractMentions('mail jane@example.com about it')).toEqual([]);
  });

  it('returns nothing for empty input', () => {
    expect(extractMentions('')).toEqual([]);
  });

  it('agrees with what highlightMentions marks up', () => {
    const text = '@Mary Jane Watson please ping @Bob about it';
    for (const name of extractMentions(text)) {
      expect(highlightMentions(text)).toContain(span(name));
    }
  });
});
