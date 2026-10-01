import type { APIRoute } from 'astro';
import { GET as postFeed } from './rss.xml';
import { GET as commentFeed } from './comments.xml';

// Exact XML in static index files preserves the old WordPress feed paths.
export function getStaticPaths() {
  return [{ params:{feed:'feed/index.html'} }, { params:{feed:'comments/feed/index.html'} }];
}
export const GET: APIRoute = context => context.params.feed === 'comments/feed/index.html'
  ? commentFeed(context) : postFeed(context);
