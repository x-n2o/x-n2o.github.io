import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { decodeHTML } from 'entities';

const dist = resolve('dist');
const manifest = JSON.parse(await readFile('migration/posts.json', 'utf8'));
const hash = s => createHash('sha256').update(s).digest('hex');
for (const asset of JSON.parse(await readFile('migration/assets.json', 'utf8'))) {
  assert.equal(hash(await readFile(asset.path)), asset.sha256, `Recovered asset changed: ${asset.path}`);
  assert.equal(hash(await readFile(join(dist, asset.path.replace(/^public\//, '')))), asset.sha256, `Built asset changed: ${asset.path}`);
}
const parsed = new Map();
async function page(path) {
  if (!parsed.has(path)) parsed.set(path, load(await readFile(path, 'utf8')));
  return parsed.get(path);
}
let comments = 0, code = 0;
for (const expected of manifest.posts) {
  const path = `src/content/posts/${expected.slug}.json`;
  const post = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(post.publishedAt, expected.publishedAt, `Publication date changed: ${post.slug}`);
  assert.equal(post.localDate, expected.localDate, `Local date changed: ${post.slug}`);
  assert.equal(hash(post.originalContent), expected.contentSha256, `Original content changed: ${post.slug}`);
  assert.equal(post.comments.length, expected.approvedComments);
  assert.ok(!JSON.stringify(post).match(/comment_author_email|comment_author_IP|user_pass/), 'Private database fields exported');
  const dates = execFileSync('git', ['log', '--diff-filter=A', '--format=%aI%n%cI', '--', path], { encoding:'utf8' }).trim().split('\n');
  assert.equal(new Date(dates[0]).toISOString(), new Date(post.publishedAt).toISOString(), `Git author date: ${post.slug}`);
  assert.equal(new Date(dates[1]).toISOString(), new Date(post.publishedAt).toISOString(), `Git committer date: ${post.slug}`);
  const $ = await page(join(dist, post.slug, 'index.html'));
  assert.equal($('h1').text(), post.title);
  assert.equal($('meta[property="article:published_time"]').attr('content'), post.publishedAt);
  assert.equal(JSON.parse($('script[type="application/ld+json"]').text()).datePublished, post.publishedAt);
  assert.equal($('.comment-list > li').length, post.comments.length);
  for (const c of post.comments) assert.equal($(`#comment-${c.id} .comment-header strong`).text(), c.author);
  const originalCode = [...post.originalContent.matchAll(/\[code(?:\s+([^\]]*))?\]([\s\S]*?)\[\/code\]|<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi)]
    .map(m => decodeHTML(m[2] ?? m[4] ?? '').replace(/^\r?\n|\r?\n$/g, '').replace(/\r\n/g, '\n'));
  const renderedCode = $('.prose .code-block pre code').toArray().map(el => $(el).text());
  assert.deepEqual(renderedCode, originalCode, `Rendered code changed: ${post.slug}`);
  assert.ok(!$('.prose').text().includes('XN2OCODEPLACEHOLDER'));
  assert.ok(!$('.prose').text().match(/\[\/?code(?:\s|\])/));
  comments += post.comments.length;
  code += originalCode.length;
}
async function walk(dir) {
  const paths = [];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}
const files = await walk(dist);
let links = 0;
for (const file of files.filter(p => p.endsWith('.html'))) {
  const text = await readFile(file, 'utf8');
  if (text.startsWith('<?xml')) continue;
  const $ = await page(file);
  const ids = $('[id]').toArray().map(el => $(el).attr('id'));
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${relative(dist,file)}`);
  const base = 'https://x-n2o.net/' + relative(dist,file).replace(/index\.html$/, '');
  for (const el of $('a[href], img[src], script[src], link[href]').toArray()) {
    const href = $(el).attr('href') ?? $(el).attr('src');
    const url = new URL(href, base);
    if (url.origin !== 'https://x-n2o.net') continue;
    const candidates = [join(dist,decodeURIComponent(url.pathname)),join(dist,decodeURIComponent(url.pathname),'index.html')];
    let target;
    for (const candidate of candidates) {
      try { if ((await stat(candidate)).isFile()) { target = candidate; break; } } catch {}
    }
    assert.ok(target, `Broken local link ${href} in ${relative(dist,file)}`);
    if (url.hash && target.endsWith('.html')) {
      const dest = await page(target);
      const id = decodeURIComponent(url.hash.slice(1));
      assert.ok(dest('[id], a[name]').toArray().some(el => dest(el).attr('id') === id || dest(el).attr('name') === id), `Missing anchor ${href} in ${relative(dist,file)}`);
    }
    links++;
  }
  assert.ok(!text.match(/http:\/\/localhost|google-analytics\.com|wp-admin/), `Legacy runtime URL in ${file}`);
}
const rss = load(await readFile('dist/rss.xml','utf8'), {xmlMode:true});
assert.equal(rss('item').length, manifest.posts.length);
assert.deepEqual(rss('item pubDate').toArray().map(el => new Date(rss(el).text()).toISOString()).sort(), manifest.posts.map(p => new Date(p.publishedAt).toISOString()).sort());
const commentFeed = load(await readFile('dist/comments.xml','utf8'), {xmlMode:true});
assert.equal(commentFeed('item').length, comments);
assert.equal((await readFile('dist/CNAME','utf8')).trim(), 'x-n2o.net');
console.log(`Verified ${manifest.posts.length} posts, ${comments} comments, ${code} code blocks and ${links} local links. Original content hashes and Git dates match the backup.`);
