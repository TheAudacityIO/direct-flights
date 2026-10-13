/**
 * Markdown to HTML for blog posts (server only: imported from posts.server.ts).
 * Posts are first-party, but raw HTML is escaped, images drop to their alt
 * text (no third-party requests) and only http(s), mailto, root-relative and
 * #fragment links survive, as defence in depth. External links open in a new
 * tab with rel="noopener".
 */
import { Marked } from "marked";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      if (!SAFE_HREF.test(href)) return inner;
      const attrs = [`href="${escapeHtml(href)}"`];
      if (title) attrs.push(`title="${escapeHtml(title)}"`);
      if (/^https?:\/\//i.test(href)) attrs.push('target="_blank"', 'rel="noopener"');
      return `<a ${attrs.join(" ")}>${inner}</a>`;
    },
  },
});

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false });
}
