// Verify normal future publishing without depending on the original private notes.
// Temporary files are exclusive-created and only files owned by this run are removed.
import assert from 'node:assert/strict';
import { writeFile, readFile, unlink, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const created = [];
const published = '__verify-future-note';
const draft = '__verify-draft-note';
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if(result.error) throw result.error;
  assert.equal(result.status, 0, args.join(' '));
}
async function add(slug, isDraft) {
  const path = resolve(root, 'src/content/notes', slug + '.md');
  const content = '---\ntitle: 写作流程验证\ndescription: 临时验证新文章和草稿。\ncategory: web\ntags: [临时验证]\ncover: web\ndraft: ' + isDraft +
    '\n---\n\n## 简短笔记\n\n这是很短的一篇笔记，没有代码围栏。\n\n' +
    '![Markdown 图片](/favicon.svg)\n\n<img src="/favicon.svg" alt="HTML 图片" loading="eager" decoding="sync" referrerpolicy="origin">\n';
  await writeFile(path, content, { flag: 'wx' });
  created.push(path);
}
try {
  await add(published, false);
  await add(draft, true);
  run(['scripts/astro.mjs', 'build']);
  run(['--test', 'tests/site/build.test.mjs']);
  const index = JSON.parse(await readFile(resolve(root, 'dist/search-index.json'), 'utf8'));
  assert.ok(index.some(note => note.url === '/notes/' + published + '/'));
  assert.ok(!index.some(note => note.url.includes(draft)));
  await assert.rejects(access(resolve(root, 'dist/notes', draft, 'index.html')), { code: 'ENOENT' });
  for(const path of ['index.html', 'notes/index.html', 'rss.xml', 'sitemap.xml']) {
    assert.ok(!(await readFile(resolve(root, 'dist', path), 'utf8')).includes(draft), path);
  }
  console.log('Future short note, raw/Markdown image policy, and unpublished draft verified.');
} finally {
  for(const path of created) await unlink(path);
  if(created.length) run(['scripts/astro.mjs', 'build']);
}
run(['--test', 'tests/site/build.test.mjs']);

