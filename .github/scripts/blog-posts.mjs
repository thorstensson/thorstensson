/**
 * Updates the "Latest Blog Posts" list in README.md from the portfolio's
 * public /api/blog route. No secrets: the route only runs a fixed query.
 * Fails without touching README.md if anything looks wrong.
 */
import { readFile, writeFile } from 'node:fs/promises'

const API_URL = 'https://thomasthorstensson.com/api/blog'
const POST_URL = 'https://thomasthorstensson.com/blog-post/'
const COUNT = 5
const README = 'README.md'
const START = '<!-- BLOG-POST-LIST:START -->'
const END = '<!-- BLOG-POST-LIST:END -->'

const fail = (message) => {
  console.error(`blog-posts: ${message}`)
  process.exit(1)
}

const response = await fetch(API_URL)
if (!response.ok) fail(`${API_URL} answered ${response.status}`)

const body = await response.json()
const posts = (body?.data?.posts ?? []).filter((p) => p?.title && p?.slug)
if (posts.length === 0) fail('no posts in response')

/* Same order as the portfolio's blog page (ViewBlogExcerpts.vue) */
const lines = posts
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, COUNT)
  .map((p) => `- [${p.title.replace(/([[\]])/g, '\\$1')}](${POST_URL}${p.slug})`)

const readme = await readFile(README, 'utf8')
const start = readme.indexOf(START)
const end = readme.indexOf(END)
if (start === -1 || end === -1 || end < start) fail('markers missing in README.md')

const updated =
  readme.slice(0, start + START.length) +
  '\n' + lines.join('\n') + '\n' +
  readme.slice(end)

if (updated === readme) {
  console.log('blog-posts: no change')
} else {
  await writeFile(README, updated)
  console.log(`blog-posts: wrote ${lines.length} posts`)
}
