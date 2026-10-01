import type { APIRoute } from 'astro';
import { posts, plainText } from '../lib/posts';
import { xmlEscape as escape } from '../lib/xml';
export const GET: APIRoute = ({ site }) => new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Comments on X-N2O's Blog</title><link>${site}</link><description>Archived comments from the original blog.</description>
${posts.flatMap(p => p.comments.map(c => ({post:p,comment:c}))).sort((a,b) => b.comment.publishedAt.localeCompare(a.comment.publishedAt)).map(({post:p,comment:c}) => `<item><title>${escape(`${c.author} on ${p.title}`)}</title><link>${new URL(`/${p.slug}/#comment-${c.id}`,site)}</link><guid>${new URL(`/${p.slug}/#comment-${c.id}`,site)}</guid><pubDate>${new Date(c.publishedAt).toUTCString()}</pubDate><description>${escape(plainText(c.content))}</description></item>`).join('\n')}
</channel></rss>`, { headers:{'Content-Type':'application/rss+xml; charset=utf-8'} });
