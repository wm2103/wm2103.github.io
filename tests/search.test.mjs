import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchNotes, plainText } from '../src/lib/search.mjs';
test('searches Chinese body text and multiple case-insensitive keywords', () => {
  const notes = [{ title: 'Vue + Spring Boot', tags: ['Java'], text: '配置与事务回滚', category: '开发笔记' }, { title: '神经网络', tags: ['Python'], text: '反向传播', category: '深度学习' }];
  assert.equal(searchNotes(notes, '事务回滚').length, 1);
  assert.equal(searchNotes(notes, 'SPRING java').length, 1);
  assert.equal(searchNotes(notes, 'python spring').length, 0);
  assert.equal(searchNotes(notes, '   ').length, 2);
});
test('search index drops image URLs and markup but keeps prose and code', () => {
  const text = plainText('# 标题\n![图](https://cdn.example/image.png)\n<font color="red">笔记</font>\n~~~java\nreturn 42;\n~~~\n[参考](https://example.com)');
  assert.ok(text.includes('标题'));
  assert.ok(text.includes('return 42;'));
  assert.ok(!text.includes('https://'));
  assert.ok(!text.includes('<font'));
});
