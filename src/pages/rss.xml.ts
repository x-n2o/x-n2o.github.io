import type { APIRoute } from 'astro';
import { posts, excerpt } from '../lib/posts';
import { xmlEscape as escape } from '../lib/xml';
export const GET: APIRoute = ({ site }) => new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>X-N2O's Blog</title><link>${site}</link><description>Programming, cryptography and reverse engineering.</description><language>en</language>
<atom:link href="${new URL('/rss.xml', site)}" rel="self" type="application/rss+xml" />
${posts.map(p => `<item><title>${escape(p.title)}</title><link>${new URL(`/${p.slug}/`, site)}</link><guid isPermaLink="true">${new URL(`/${p.slug}/`, site)}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${escape(excerpt(p))}</description>${p.categories.map(c => `<category>${escape(c.name)}</category>`).join('')}</item>`).join('\n')}
</channel></rss>`, { headers: { 'Content-Type':'application/rss+xml; charset=utf-8' } });
