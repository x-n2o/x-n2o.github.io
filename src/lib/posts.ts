import { z } from 'astro/zod';
import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

const label = z.object({ name: z.string(), slug: z.string() });
export const postSchema = z.object({
  id: z.number().int(), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string(),
  publishedAt: z.iso.datetime(), localDate: z.string(), updatedAt: z.iso.datetime(),
  author: z.string(), categories: z.array(label), tags: z.array(label), originalContent: z.string(),
  comments: z.array(z.object({
    id: z.number().int(), parent: z.number().int(), author: z.string(), publishedAt: z.iso.datetime(),
    localDate: z.string(), content: z.string(),
  })),
});
export type Post = z.infer<typeof postSchema>;
const modules = import.meta.glob('../content/posts/*.json', { eager: true, import: 'default' });
export const posts = Object.values(modules).map((p) => postSchema.parse(p))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
if (new Set(posts.map((p) => p.slug)).size !== posts.length) throw new Error('Duplicate post slug');

export const plainText = (html: string) => decodeHTML(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }))
  .replace(/\s+/g, ' ').trim();
export const excerpt = (post: Post) => plainText(post.originalContent.split('<!--more-->')[0]);
export const description = (post: Post) => {
  const text = excerpt(post);
  return text.length > 180 ? text.slice(0, 177).replace(/\s+\S*$/, '') + '…' : text;
};
export const readingTime = (post: Post) => Math.max(1, Math.ceil(post.originalContent.split(/\s+/).length / 220));
// Display the original local calendar date, even when the UTC instant is on the previous day.
export const formatDate = (localDate: string) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(localDate.slice(0, 10) + 'T12:00:00Z'));
export const categories = [...new Map(posts.flatMap((p) => p.categories).map((c) => [c.slug, c])).values()];
export const tags = [...new Map(posts.flatMap((p) => p.tags).map((c) => [c.slug, c])).values()];
