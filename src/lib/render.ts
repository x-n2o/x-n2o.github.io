import { autop } from '@wordpress/autop';
import sanitizeHtml from 'sanitize-html';
import { codeToHtml } from 'shiki';
import { plainText } from './posts';
import { decodeHTML } from 'entities';

const decode = decodeHTML;
export function codeBlocks(content: string) {
  return [...content.matchAll(/\[code(?:\s+([^\]]*))?\]([\s\S]*?)\[\/code\]|<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi)]
    .map((m) => ({ original: m[0], attributes: m[1] ?? m[3] ?? '', code: decode(m[2] ?? m[4] ?? '').replace(/^\r?\n|\r?\n$/g, '').replace(/\r\n/g, '\n') }));
}

export async function renderContent(content: string, postId: number) {
  const blocks = codeBlocks(content);
  const highlights: string[] = [];
  for (const [i, block] of blocks.entries()) {
    const language = /nasm|asm/.test(block.attributes) ? 'asm' : /lang=["']c["']|brush\s*:\s*c\b/.test(block.attributes) ? 'c' : 'text';
    const html = await codeToHtml(block.code, { lang: language, themes: { light: 'github-light', dark: 'github-dark' } });
    highlights.push(`<div class="code-block"><div class="code-bar"><span>${language === 'asm' ? 'Assembly' : language === 'c' ? 'C' : 'Code'}</span><button type="button" class="copy-code" aria-label="Copy code block ${i + 1}">Copy</button></div>${html}</div>`);
    content = content.replace(block.original, `<div>XN2OCODEPLACEHOLDER${i}END</div>`);
  }
  content = content.replace('<!--more-->', `<span id="more-${postId}"></span>`);
  // This external image is absent from the backup and its original host returns 404.
  content = content.replace(/<a\b[^>]*href="http:\/\/img801\.imageshack\.us[^>]*>\s*<img[^>]*>\s*<\/a>/g,
    '<aside class="missing-media">The original Huffman tree image is unavailable. <a href="http://img801.imageshack.us/img801/212/11082010163.jpg">Original image link ↗</a></aside>');
  content = content.replace(/https?:\/\/(?:www\.)?x-n2o\.(?:net|com)\//g, '/')
    .replace('http://i.creativecommons.org/l/by/3.0/80x15.png', '/images/cc-by.png');
  let html = sanitizeHtml(autop(content), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'span', 'aside'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['id'], aside: ['class'],
      a: ['href', 'name', 'title', 'rel'], img: ['src', 'alt', 'title', 'width', 'height', 'loading'] },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, ...(attribs.href?.startsWith('http') ? { rel: 'noopener noreferrer' } : {}) } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', alt: attribs.alt || attribs.title || 'Archived illustration' } }),
    },
  });
  highlights.forEach((h, i) => { html = html.replace(`<div>XN2OCODEPLACEHOLDER${i}END</div>`, h); });
  const headings: { id: string; text: string }[] = [];
  html = html.replace(/<h([234])([^>]*)>([\s\S]*?)<\/h\1>/g, (_match, level, attributes, body) => {
    const id = `section-${headings.length + 1}`;
    headings.push({ id, text: plainText(body) });
    const semanticLevel = Math.max(2, Number(level) - 1);
    return `<h${semanticLevel}${attributes} id="${id}">${body}</h${semanticLevel}>`;
  });
  return { html, headings };
}

export function renderComment(content: string) {
  return sanitizeHtml(autop(content), {
    allowedTags: ['p', 'br', 'a', 'em', 'strong', 'b', 'i', 'code', 'pre', 'blockquote'],
    allowedAttributes: { a: ['href', 'rel'] },
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer' }) },
  });
}
