import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { importNotes, transformNote } from '../scripts/import-notes.mjs';
import { NOTE_CATALOG } from '../scripts/note-catalog.mjs';

test('cleans export typography while preserving prose, attribution, fenced code and inline code', () => {
  const code = '```html\n<font style="color:red">example</font>\n<span style="color:blue">code</span>\n```';
  const source = '---\ntitle: old title\n---\n## <font color="red">学习笔记</font>\n'
    + '<span style="font-size:12px">我还没看懂。</span>\n'
    + '<p style="color:red" class="reference">原文：[作者](https://example.com/source)</p>\n'
    + '`<span style="color:red">inline</span>`\n' + code + '\n';
  const result = transformNote(source);
  assert.ok(result.body.startsWith('## 学习笔记\n我还没看懂。'));
  assert.ok(result.body.includes('<p class="reference">原文：[作者](https://example.com/source)</p>'));
  assert.ok(result.body.includes('`<span style="color:red">inline</span>`'));
  assert.ok(result.body.includes(code));
  assert.ok(!result.body.includes('old title'));
});

test('protects quoted and tilde code fences from typography and image processing', () => {
  const source = '> ~~~markdown\n> <font style="color:red">example</font>\n> ![](assets/example.png)\n> ~~~\n';
  const result = transformNote(source, { assetExists: () => false });
  assert.equal(result.body, source);
  assert.equal(result.missingAssets.length, 0);
});

test('cleans known export font wrappers inside inline code but preserves intentional HTML examples', () => {
  const exported = '<font style="color:rgb(15, 17, 21);background-color:rgb(235, 238, 242);">';
  const example = '`<font style="color:rgb(0, 0, 0)">HTML example</font>`';
  const source = '`' + exported + 'ObjectOutputStream</font>` 与 `' + exported + 'com.sky.mapper</font>`\n'
    + example + '\n```html\n' + exported + 'fenced example</font>\n```\n';
  const result = transformNote(source);
  assert.ok(result.body.startsWith('`ObjectOutputStream` 与 `com.sky.mapper`\n'));
  assert.ok(result.body.includes(example));
  assert.ok(result.body.includes('```html\n' + exported + 'fenced example</font>\n```'));
  assert.equal(result.cleanedTags, 4);
});

test('adds a Java fence only to a catalog-reviewed malformed code excerpt', () => {
  const expectedLines = [
    '> @ExceptionHandler(DuplicateKeyException.class)', '>',
    '> public Result<String> handleDuplicateKeyException(DuplicateKeyException ex) {', '>',
    '>     return Result.error("数据已存在，请勿重复添加");', '>', '>', '> }',
  ];
  const source = ['# 学习记录', ...expectedLines, '> 正文继续。', ''].join('\n');
  const repair = { startLine: 2, endLine: 9, language: 'java', expectedLines, reason: '遗漏代码围栏，泛型被解析为 HTML' };
  const result = transformNote(source, { codeBlockRepairs: [repair] });
  assert.ok(result.body.includes('> ```java\n' + expectedLines.join('\n') + '\n> ```\n> 正文继续。'));
  assert.deepEqual(result.codeBlockRepairs, [{ startLine: 2, endLine: 9, language: 'java', reason: repair.reason }]);
  assert.equal(transformNote(source).body, source);
  assert.throws(() => transformNote(source.replace('Result<String>', 'Result<Integer>'), { codeBlockRepairs: [repair] }), /代码围栏修复与原文不匹配/);
});

test('Day 02 catalog repairs a self-contained exported exception handler without losing the generic type', () => {
  const entry = NOTE_CATALOG.find(({ slug }) => slug === 'sky-takeout-day02');
  const repair = entry.codeBlockRepairs[0];
  // Use the reviewed, credential-free excerpt with representative export tags.
  // CI deliberately has no access to the ignored original course notebooks.
  const lines = Array(repair.startLine - 1).fill('');
  lines[0] = '# 独立课程测试夹具';
  const exportedLines = repair.expectedLines.map((line) => line === '>' ? line
    : '> <font style="color:rgb(15, 17, 21);">' + line.slice(2) + '</font>');
  const inlineExample = '`<font style="color:rgb(15, 17, 21);background-color:rgb(235, 238, 242);">ObjectOutputStream</font>`';
  const source = [...lines, ...exportedLines, '>', '> ' + inlineExample, ''].join('\n');
  const result = transformNote(source, entry);
  assert.ok(/> ```java\n> @ExceptionHandler\(DuplicateKeyException\.class\)[\s\S]*?> public Result<String> handleDuplicateKeyException[\s\S]*?> }\n> ```/.test(result.body));
  assert.ok(result.body.includes(repair.expectedLines.join('\n')));
  assert.ok(result.body.includes('`ObjectOutputStream`'));
  assert.equal(result.codeBlockRepairs.length, 1);
  assert.equal(result.codeBlockRepairs[0].startLine, 557);
  assert.equal(result.codeBlockRepairs[0].endLine, 563);
  assert.ok(!result.body.includes('<font style="color:rgb'));
});

test('reports missing local images with useful placeholders and preserves exact external URLs', () => {
  const external = 'https://cdn.example.com/image.png?x=1&originHeight=500#align=left';
  const source = '## 数据库环境搭建\n![](assets/sky.png)\n![架构图](' + external + ')\n'
    + '![](assets/present.png)\n';
  const result = transformNote(source, {
    assetExists: (asset) => asset === 'assets/present.png',
    missingAssetDescriptions: { 'assets/sky.png': 'sky.sql 数据库导入界面' },
  });
  assert.match(result.body, /> 图片暂缺：sky\.sql 数据库导入界面。原笔记引用的本地图片未随文提供。/);
  assert.ok(!result.body.includes('![](assets/sky.png)'));
  assert.ok(result.body.includes('![架构图](' + external + ')'));
  assert.ok(result.body.includes('![](assets/present.png)'));
  assert.deepEqual(result.missingAssets, [{ line: 2, path: 'assets/sky.png', description: 'sky.sql 数据库导入界面' }]);
  assert.deepEqual(result.externalImages, [{ line: 3, url: external }]);
});

test('unindents a catalog-reviewed standalone exported image', () => {
  const url = 'https://cdn.example.com/diagram.png?height=500';
  const expectedLine = '\t\t![](' + url + ')';
  const result = transformNote('## 图示\n' + expectedLine + '\n正文\n', {
    imageIndentationRepairs: [{ line: 2, expectedLine, reason: '测试修复' }],
  });
  assert.equal(result.body, '## 图示\n![](' + url + ')\n正文\n');
});

test('repairs only a reviewed image indentation and preserves list and Markdown example indentation', () => {
  const image = '![](https://cdn.example.com/neural.jpeg?width=511#originHeight=350&title=)';
  const expectedLine = ' \t\t\t' + image;
  const untouched = ['    ' + image, '- 配图', '    ' + image, '```markdown', expectedLine, '```'];
  const source = ['---', 'title: old note', '---', '', '## 神经网络是啥', expectedLine, '图示正文。', ...untouched, ''].join('\n');
  const repair = { line: 6, expectedLine, reason: '图片误缩进为代码块' };
  const result = transformNote(source, { imageIndentationRepairs: [repair] });
  assert.ok(result.body.startsWith('## 神经网络是啥\n' + image + '\n图示正文。'));
  assert.ok(result.body.includes(untouched.join('\n')));
  assert.deepEqual(result.imageIndentationRepairs, [{ line: 6, reason: repair.reason }]);
  assert.equal(transformNote(source).body, source.split('\n').slice(4).join('\n'));
  assert.throws(() => transformNote(source.replace('width=511', 'width=512'), { imageIndentationRepairs: [repair] }), /图片缩进修复与原文不匹配/);
  assert.throws(() => transformNote('```markdown\n' + expectedLine + '\n```\n', {
    imageIndentationRepairs: [{ ...repair, line: 2 }],
  }), /图片缩进修复/);
});

test('neural-network catalog repairs its known image using a self-contained source fixture', () => {
  const entry = NOTE_CATALOG.find(({ slug }) => slug === 'neural-network');
  const repair = entry.imageIndentationRepairs[0];
  const lines = Array(repair.line - 1).fill('');
  lines[repair.line - 2] = '## 神经网络是啥';
  const result = transformNote([...lines, repair.expectedLine, '**神经网络**示意图。', ''].join('\n'), entry);
  assert.ok(result.body.includes('## 神经网络是啥\n' + repair.expectedLine.trimStart() + '\n**神经网络**示意图。'));
  assert.equal(result.imageIndentationRepairs[0].line, 744);
  assert.deepEqual(result.externalImages, [{ line: 744, url: repair.expectedLine.match(/!\[\]\((.+)\)/)[1] }]);
});

test('replaces literal cloud credentials in imported code without changing references or teaching defaults', () => {
  const fakeId = 'LTAI' + 'A'.repeat(20);
  const fakeAccessSecret = 'B'.repeat(30);
  const fakeWechatId = 'wx' + 'c'.repeat(16);
  const fakeWechatSecret = 'd'.repeat(32);
  const source = [
    '---', 'title: test', '---', '```yaml',
    `access-key-id: ${fakeId}`, `access-key-secret: ${fakeAccessSecret}`,
    `appid: ${fakeWechatId}`, `secret: ${fakeWechatSecret}`,
    'access-key-id: ${sky.alioss.access-key-id}', 'secret: ${sky.wechat.secret}',
    'password: 123456', 'admin-secret-key: itcast', '```',
  ].join('\n');
  const result = transformNote(source);
  assert.ok(result.body.includes('access-key-id: ${ALIYUN_ACCESS_KEY_ID}'));
  assert.ok(result.body.includes('access-key-secret: ${ALIYUN_ACCESS_KEY_SECRET}'));
  assert.ok(result.body.includes('appid: ${WECHAT_APP_ID}'));
  assert.ok(result.body.includes('secret: ${WECHAT_APP_SECRET}'));
  assert.ok(result.body.includes('access-key-id: ${sky.alioss.access-key-id}'));
  assert.ok(result.body.includes('secret: ${sky.wechat.secret}'));
  assert.ok(result.body.includes('password: 123456'));
  assert.ok(result.body.includes('admin-secret-key: itcast'));
  assert.deepEqual(result.redactions.map(({ line }) => line), [5, 6, 7, 8]);
  for (const secret of [fakeId, fakeAccessSecret, fakeWechatId, fakeWechatSecret]) {
    assert.ok(!JSON.stringify(result).includes(secret), 'neither content nor report may expose the credential');
  }
});

test('catalog has exactly the eight original notes, real dates and six existing series days', () => {
  assert.deepEqual(NOTE_CATALOG.map(({ slug }) => slug), [
    'vue-spring-boot', 'neural-network', 'sky-takeout-day01', 'sky-takeout-day02',
    'sky-takeout-day03', 'sky-takeout-day05', 'sky-takeout-day06', 'sky-takeout-day07',
  ]);
  const series = NOTE_CATALOG.filter(({ metadata }) => metadata.series === 'sky-takeout');
  assert.deepEqual(series.map(({ metadata }) => metadata.seriesOrder), [1, 2, 3, 5, 6, 7]);
  assert.ok(series.every(({ metadata }) => metadata.date === undefined && metadata.importedAt === '2026-10-14'));
  assert.equal(NOTE_CATALOG[0].metadata.date, '2024-04-27');
  assert.equal(NOTE_CATALOG[1].metadata.date, '2024-04-10');
  assert.ok(NOTE_CATALOG.every(({ metadata }) => /学习|课程/.test(metadata.sourceLabel)));
});

test('repeatable imports retain all body content and source bytes without overwriting future posts', async (t) => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'onlylo-import-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await mkdir(path.join(rootDir, 'docs/notes'), { recursive: true });
  await mkdir(path.join(rootDir, 'src/content/notes'), { recursive: true });
  const sourcePath = path.join(rootDir, 'docs/notes/original.md');
  const indentedImage = ' \t\t\t![](https://cdn.example.com/course.png?originalType=url#height=350)';
  const source = Buffer.from('\ufeff# 完整课程\r\n\r\n> 这是我自己的批注。\r\n\r\n```java\r\nclass Example {}\r\n```\r\n\r\n原文：https://example.com/source\r\n' + indentedImage + '\r\n');
  await writeFile(sourcePath, source);
  const before = createHash('sha256').update(source).digest('hex');
  const futurePath = path.join(rootDir, 'src/content/notes/my-future-note.md');
  await writeFile(futurePath, '未来的新文章，不应被清单导入覆盖。\n');
  const catalog = [{
    slug: 'course', source: 'docs/notes/original.md',
    metadata: { title: '课程：完整导入', description: '包含个人批注', category: 'web', tags: ['Java'], cover: 'sky', importedAt: '2026-10-14', sourceLabel: '课程学习笔记' },
    imageIndentationRepairs: [{ line: 10, expectedLine: indentedImage, reason: '图片误缩进为代码块' }],
  }];
  const first = await importNotes({ rootDir, catalog });
  const outputPath = path.join(rootDir, 'src/content/notes/course.md');
  const output = await readFile(outputPath, 'utf8');
  const report = await readFile(path.join(rootDir, 'docs/content-migration.md'), 'utf8');
  assert.ok(output.includes('title: "课程：完整导入"'));
  assert.ok(output.includes('importedAt: "2026-10-14"'));
  assert.ok(output.endsWith(source.toString('utf8').replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(indentedImage, indentedImage.trimStart())));
  assert.ok(report.includes('| docs/notes/original.md:10 | 图片误缩进为代码块 |'));
  assert.equal(first.notes.length, 1);
  await importNotes({ rootDir, catalog });
  assert.equal(await readFile(outputPath, 'utf8'), output);
  assert.equal(await readFile(path.join(rootDir, 'docs/content-migration.md'), 'utf8'), report);
  assert.equal(await readFile(futurePath, 'utf8'), '未来的新文章，不应被清单导入覆盖。\n');
  assert.equal(createHash('sha256').update(await readFile(sourcePath)).digest('hex'), before);
  assert.deepEqual((await readdir(path.join(rootDir, 'src/content/notes'))).sort(), ['course.md', 'my-future-note.md']);
});
