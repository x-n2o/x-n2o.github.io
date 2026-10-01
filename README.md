# X-N2O's Blog

The original blog, restored from its 13 May 2013 cPanel backup and rebuilt as an
Astro 7 / TypeScript static site. The existing `x-n2o/x-n2o.github.io` repository
and `x-n2o.net` GitHub Pages domain are preserved.

## Local development

Use Node 24 LTS (minimum 22.12) and npm 9.6.5 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321. No WordPress, PHP, database or runtime API is needed.
The original WordPress comparison restore is maintained separately in
`../x-n2o.net` at http://localhost:8080.

```sh
npm run check
npm run build
npm run verify
npm run preview
```

`dist/` is the complete deployment artifact. These checks validate the original
content hashes, post commit dates, public comments, exact rendered code, recovered
assets, RSS dates and every internal page/asset/anchor link.

## Deploy to GitHub Pages

The repository already has Pages configured with **GitHub Actions** and the custom
domain `x-n2o.net`. The workflow builds and checks the site before uploading only
`dist/`. Pull requests run the same checks without deploying.

Merge `restore-static-blog` into `master` using **Create a merge commit**. Do not
squash or rebase: squashing removes the individual dated post commits, and rebasing
changes their committer dates. A push to `master` triggers deployment. The workflow
can also be run manually on `master`. No deployment secrets are required.

Keep the existing DNS pointing to GitHub Pages. `public/CNAME` is included in the
build. Canonical URLs, RSS and the sitemap use `https://x-n2o.net`. See
[Astro's GitHub Pages deployment guide](https://docs.astro.build/en/guides/deploy/github/).

## Preserved content and history

Every published post in the supplied backup has its own JSON source file and Git
commit, added chronologically with **both author and committer timestamps** set to
the original `wp_posts.post_date_gmt` instant. Existing repository history is kept.
These are backdated restoration commits containing the recovered 2013 snapshot,
not a claim that Git was used to publish the original WordPress blog.

| Post | Original local timestamp | Git timestamp (UTC) |
| --- | --- | --- |
| Multithreading | 2009-03-19 18:09:48 | 2009-03-19 16:09:48Z |
| AES Explained | 2009-11-22 19:19:50 | 2009-11-22 18:19:50Z |
| Clever tricks against antiviruses | 2010-04-19 00:57:14 | 2010-04-18 22:57:14Z |
| Huffman encoder in 8086 ASM | 2010-08-24 18:09:19 | 2010-08-24 16:09:19Z |
| DEFCON 20 CTF Quals B400 writeup | 2012-06-05 05:00:02 | 2012-06-05 04:00:02Z |

The display uses each post's original **local calendar date**, while feeds and
machine-readable metadata retain the exact UTC instant. Local offsets in the
source vary; the current timezone setting is not applied retroactively.

All 49 approved comments are archived with their original IDs, names, dates,
text and parent relationships. Email addresses, IPs, password hashes, drafts,
revisions and spam are excluded. Original article HTML is stored unchanged as
`originalContent`; rendering handles WordPress code shortcodes and paragraphs,
sanitizes HTML and highlights all 31 code blocks at build time with Shiki.

Post slugs, category/tag slugs, year/month archives, `#more-ID` and comment anchors
are preserved. Old `/?p=ID` and `/?s=...` links work with JavaScript; the pages
themselves work without JavaScript. RSS is available at `/rss.xml` and
`/comments.xml`, with XML copies at the old `/feed/` and `/comments/feed/` paths.
GitHub Pages serves those legacy index files with an HTML MIME type; use the
canonical `.xml` feed URLs when configuring a reader.

The original banner, favicon, AES C source ZIP and DEFCON text download are local
assets. The Huffman tree image was hosted on ImageShack, is absent from the backup
and returns 404; its place is marked with the original link. Other historical
external links remain as written and may no longer work. Internet Archive was
offline during restoration, so content after the May 2013 backup is not verified.

The raw database, WordPress installation and full hosting archive are never included
in this repository or deployment. `migration/` contains content/asset hashes and
the source-date manifest. The export tooling lives in `../x-n2o.net/scripts/`.

For a new post, add a file following the validated schema in `src/content/posts/`
and commit it normally. The date-preservation check applies to the restored posts
listed in the migration manifest.
