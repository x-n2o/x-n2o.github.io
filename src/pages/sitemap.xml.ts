import type { APIRoute } from 'astro';
import { posts, categories, tags } from '../lib/posts';
export const GET: APIRoute = ({ site }) => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
  '<url><loc>'+site+'</loc></url>',
  '<url><loc>'+new URL('/archive/',site)+'</loc></url>',
  ...posts.map(p => `<url><loc>${new URL(`/${p.slug}/`,site)}</loc><lastmod>${p.updatedAt}</lastmod></url>`),
  ...categories.map(t => `<url><loc>${new URL(`/category/${t.slug}/`,site)}</loc></url>`),
  ...tags.map(t => `<url><loc>${new URL(`/tag/${t.slug}/`,site)}</loc></url>`),
].join('')}</urlset>`, {headers:{'Content-Type':'application/xml; charset=utf-8'}});
