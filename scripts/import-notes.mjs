import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NOTE_CATALOG } from './note-catalog.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

// Match literal service credentials, not ${...} references, property access,
// course passwords such as 123456, or identifiers mentioned in explanations.
const credentialRules = [
  { key: 'access-key-id', value: 'LTAI[A-Za-z0-9]{16,}', type: '阿里云 AccessKey ID', env: 'ALIYUN_ACCESS_KEY_ID' },
  { key: 'access-key-secret', value: '[A-Za-z0-9+/=]{24,}', type: '阿里云 AccessKey Secret', env: 'ALIYUN_ACCESS_KEY_SECRET' },
  { key: 'appid', value: 'wx[a-fA-F0-9]{16}', type: '微信小程序 AppID（应用标识）', env: 'WECHAT_APP_ID' },
  { key: 'secret', value: '[a-fA-F0-9]{32}', type: '微信小程序 AppSecret', env: 'WECHAT_APP_SECRET' },
  { key: 'mchid', value: '\\d{6,}', type: '微信支付商户号', env: 'WECHAT_MERCHANT_ID' },
  { key: 'mchSerialNo', value: '[a-fA-F0-9]{20,}', type: '微信支付商户证书序列号', env: 'WECHAT_MERCHANT_SERIAL_NO' },
  { key: 'privateKeyFilePath', value: '[^\\s]+', type: '微信支付商户私钥路径', env: 'WECHAT_MERCHANT_PRIVATE_KEY_PATH' },
  { key: 'apiV3Key', value: '[A-Za-z0-9+/=_-]{16,}', type: '微信支付 APIv3 密钥', env: 'WECHAT_PAY_API_V3_KEY' },
  { key: 'weChatPayCertFilePath', value: '[^\\s]+', type: '微信支付证书路径', env: 'WECHAT_PAY_CERTIFICATE_PATH' },
  { key: 'MYSQL_ROOT_PASSWORD', value: 'dili123', type: '本地 MySQL root 示例密码', env: 'MYSQL_ROOT_PASSWORD' },
  { key: 'MYSQL_PASSWORD', value: 'dili123', type: '本地 MySQL 示例密码', env: 'MYSQL_PASSWORD' },
  { key: 'password', value: 'dili123', type: '本地数据库示例密码', env: 'MYSQL_PASSWORD' },
];

/** Normalize one complete note, retaining source line numbers for the report. */
export function transformNote(source, {
  assetExists = () => false,
  missingAssetDescriptions = {},
  codeBlockRepairs = [],
  imageIndentationRepairs = [],
  externalLinkBase,
} = {}) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const frontmatter = normalized.match(/^---\n[\s\S]*?\n---(?:\n|$)/);
  const offset = frontmatter ? frontmatter[0].split('\n').length - 1 : 0;
  const rawBody = normalized.slice(frontmatter?.[0].length ?? 0);
  const input = frontmatter ? rawBody.replace(/^\n/, '') : rawBody;
  const leadingBlank = frontmatter && rawBody.startsWith('\n') ? 1 : 0;
  const missingAssets = [];
  const externalImages = [];
  const redactions = [];
  const indentationRepairs = [];
  let fence = null;
  let section = '原笔记配图';
  let codeBlocks = 0;
  let cleanedTags = 0;

  const lines = input.split('\n').map((original, index) => {
    const lineNumber = index + 1 + offset + leadingBlank;
    let line = original;
    for (const rule of credentialRules) {
      const pattern = new RegExp(`(^[ \\t]*(?:>[ \\t]*)?${rule.key}[ \\t]*:[ \\t]*)(["']?)${rule.value}\\2(?=[ \\t]*(?:#.*)?$)`, 'i');
      line = line.replace(pattern, (_, prefix, quote) => {
        const placeholder = '${' + rule.env + '}';
        redactions.push({ line: lineNumber, type: rule.type, placeholder });
        return prefix + quote + placeholder + quote;
      });
    }

    const fenceMatch = line.match(/^\s*(?:>\s*)*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence.character && fenceMatch[1].length >= fence.length && !fenceMatch[2].trim()) {
        fence = null;
      }
      return line;
    }
    if (fenceMatch) {
      fence = { character: fenceMatch[1][0], length: fenceMatch[1].length };
      codeBlocks += 1;
      return line;
    }

    const imageRepair = imageIndentationRepairs.find((repair) => repair.line === lineNumber);
    if (imageRepair) {
      if (original !== imageRepair.expectedLine || !/^[ \t]+!\[[^\]]*\]\(.+\)$/.test(original)) {
        throw new Error(`图片缩进修复与原文不匹配：${lineNumber} 行`);
      }
      line = line.trimStart();
      indentationRepairs.push({ line: lineNumber, reason: imageRepair.reason });
    }

    // Inline code is also learning content: only strip tags from recognized documentation exports.
    const hasKnownExportFont = /<font\s+style=(['"])\s*color:\s*rgb\((?:3,\s*7,\s*16|15,\s*17,\s*21)\)/i.test(line);
    const inlineCode = [];
    line = line.replace(/(`+)([\s\S]*?)\1(?!`)/g, (match) => {
      // Yuque exported these exact two colors around ordinary code tokens.
      // Other HTML examples stay literal, including all fenced examples.
      const cleaned = match.replace(/<font\s+style=(["'])\s*color:\s*rgb\(15,\s*17,\s*21\);\s*background-color:\s*rgb\(235,\s*238,\s*242\);?\s*\1>([\s\S]*?)<\/font>/gi, (_, quote, content) => {
        cleanedTags += 2;
        return content;
      });
      if (hasKnownExportFont) {
        const exportTags = cleaned.match(/<font\s+style=(['"])\s*color:\s*rgb\((?:3,\s*7,\s*16|15,\s*17,\s*21)\)[^>]*>|<\/font>/gi) || [];
        cleanedTags += exportTags.length;
        inlineCode.push(cleaned.replace(/<font\s+style=(['"])\s*color:\s*rgb\((?:3,\s*7,\s*16|15,\s*17,\s*21)\)[^>]*>|<\/font>/gi, ''));
      } else {
        inlineCode.push(cleaned);
      }
      return `\u0000CODE${inlineCode.length - 1}\u0000`;
    });
    if (externalLinkBase) {
      const linkBase = externalLinkBase.replace(/\/+$/, '');
      line = line.replace(/(\]\()\/(?!\/)([^)\s]+)/g, `$1${linkBase}/$2`);
      line = line.replace(/(\bhref\s*=\s*['"])\/(?!\/)/gi, `$1${linkBase}/`);
    }
    line = line.replace(/<\/?(?:font|span)\b[^>]*>/gi, () => {
      cleanedTags += 1;
      return '';
    });
    line = line.replace(/<[a-z][^>]*>/gi, (tag) => tag.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, () => {
      cleanedTags += 1;
      return '';
    }));
    const heading = line.match(/^\s*(?:>\s*)?#{1,6}\s+(.+?)\s*#*$/);
    if (heading) section = heading[1].replace(/[*_`]/g, '');

    const replaceImage = (match, alt, url) => {
      if (/^(?:https?:)?\/\//i.test(url)) {
        externalImages.push({ line: lineNumber, url });
        return match;
      }
      if (/^(?:data:|#)/i.test(url) || assetExists(url)) return match;
      const description = missingAssetDescriptions[url] || alt || `${section}配图`;
      missingAssets.push({ line: lineNumber, path: url, description });
      return `\n\n> 图片暂缺：${description}。原笔记引用的本地图片未随文提供。\n\n`;
    };
    line = line.replace(/!\[([^\]]*)\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\s*\)/g,
      (match, alt, enclosed, plain) => replaceImage(match, alt, enclosed || plain));
    line = line.replace(/<img\b[^>]*>/gi, (tag) => {
      const url = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] || '';
      return url ? replaceImage(tag, alt, url) : tag;
    });
    return line.replace(/\u0000CODE(\d+)\u0000/g, (_, number) => inlineCode[Number(number)]);
  });
  if (indentationRepairs.length !== imageIndentationRepairs.length) {
    throw new Error('图片缩进修复未匹配到围栏之外的原文行');
  }
  const repairs = [];
  for (const repair of codeBlockRepairs) {
    const start = repair.startLine - offset - leadingBlank - 1;
    const end = repair.endLine - offset - leadingBlank - 1;
    if (lines.slice(start, end + 1).join('\n') !== repair.expectedLines.join('\n')) {
      throw new Error(`代码围栏修复与原文不匹配：${repair.startLine}–${repair.endLine} 行`);
    }
    const prefix = lines[start].match(/^(?:>\s*)+/)?.[0] || '';
    lines[start] = prefix + '```' + repair.language + '\n' + lines[start];
    lines[end] += '\n' + prefix + '```';
    repairs.push({ startLine: repair.startLine, endLine: repair.endLine, language: repair.language, reason: repair.reason });
  }
  const body = lines.join('\n');
  return {
    body: body.endsWith('\n') ? body : body + '\n',
    missingAssets,
    externalImages,
    redactions,
    codeBlocks,
    cleanedTags,
    codeBlockRepairs: repairs,
    imageIndentationRepairs: indentationRepairs,
  };
}

function renderReport(notes) {
  const missing = notes.flatMap((note) => note.missingAssets.map((asset) => ({ ...asset, source: note.source })));
  const redactions = notes.flatMap((note) => note.redactions.map((entry) => ({ ...entry, source: note.source })));
  const external = notes.flatMap((note) => note.externalImages);
  const repairs = notes.flatMap((note) => note.codeBlockRepairs.map((repair) => ({ ...repair, source: note.source })));
  const imageRepairs = notes.flatMap((note) => note.imageIndentationRepairs.map((repair) => ({ ...repair, source: note.source })));
  const hosts = new Map();
  for (const { url } of external) {
    const host = new URL(url.startsWith('//') ? 'https:' + url : url).hostname;
    hosts.set(host, (hosts.get(host) || 0) + 1);
  }
  const text = [
    '# 学习笔记迁移记录',
    '',
    '每篇笔记的整理日期记录在 frontmatter 的 `importedAt` 字段中。此文件由 `node scripts/import-notes.mjs` 生成，可重复生成。',
    '',
    `已导入 ${notes.length} 篇完整笔记，原文共 ${notes.reduce((sum, note) => sum + note.sourceBytes, 0).toLocaleString('en-US')} 字节，保留 ${notes.reduce((sum, note) => sum + note.codeBlocks, 0)} 个围栏代码块。`,
    `清理导出字体/跨度标签及内联样式 ${notes.reduce((sum, note) => sum + note.cleanedTags, 0)} 处，包括行内代码中可识别的语雀导出字体包装；有意书写的 HTML 示例与原有围栏代码保留。没有删去学习批注、未完成标记、来源链接或参考资料。`,
    `另为 ${repairs.length} 段已人工核对的代码补齐围栏，导入后共 ${notes.reduce((sum, note) => sum + note.codeBlocks, 0) + repairs.length} 个围栏代码块。`,
    '',
    '## 导入清单',
    '',
    '| 文章 | 来源 | 原文行数 | 外链图片引用 | 缺失本地图片 |',
    '| --- | --- | ---: | ---: | ---: |',
    ...notes.map((note) => `| [${note.title}](../src/content/notes/${note.slug}.md) | ${note.source} | ${note.sourceLines} | ${note.externalImages.length} | ${note.missingAssets.length} |`),
    '',
    '苍穹外卖系列按现有 Day 01、02、03、05、06、07、08、10 排序。Day 04 和 Day 09 没有独立笔记，保留原有缺号。',
    '两篇旧文章保留已有日期：Vue + Spring Boot 为 2024-04-27，神经网络为 2024-04-10；其他课程、项目与官方文档学习笔记只记录整理日期，没有推测发布日期。',
    '来源标签明确为课程学习笔记、项目学习笔记或官方文档学习笔记。原文、个人批注、课程截图、示例代码和参考链接均保留，未改写为原创成果。',
    '',
    '## 本地图片缺失',
    '',
    `发现 ${missing.length} 处本地图片引用没有对应文件，已用包含配图含义的引用块替换。以下路径相对于各自的源笔记。`,
    '',
    '| 源文件及行号 | 原图片路径 | 页面占位说明 |',
    '| --- | --- | --- |',
    ...missing.map((asset) => `| ${asset.source}:${asset.line} | \`${asset.path}\` | ${asset.description} |`),
    '',
    '## 外链图片状态',
    '',
    `正文保留 ${external.length} 处外链图片引用（${new Set(external.map(({ url }) => url)).size} 个不同 URL）。所有 URL、查询参数与片段均保留在对应导入文章中。`,
    '外链图片没有下载到本地，也没有逐个联网验证。以下均为尚未解决的外部资源依赖；图床失效、鉴权或防盗链仍可能导致加载失败。此报告不将“保留链接”记为“图片已恢复”。',
    '',
    '| 外部图床 | 引用次数 | 状态 |',
    '| --- | ---: | --- |',
    ...[...hosts].sort(([a], [b]) => a.localeCompare(b)).map(([host, count]) => `| ${host} | ${count} | 原 URL 保留，可用性未验证 |`),
    '',
    '## 配置值替换',
    '',
    `仅在导入副本中替换 ${redactions.length} 处符合实际云服务格式的配置值。原始文件不变，报告不记录原值。AppID 是应用标识，与对应密钥一起改为环境变量示例。`,
    '教学默认密码、变量引用和普通代码未做泛化替换；图片内的配置文本不在本次纯文本检查范围内。',
    '',
    '| 源文件及行号 | 类型 | 副本中的环境变量占位符 |',
    '| --- | --- | --- |',
    ...redactions.map((entry) => `| ${entry.source}:${entry.line} | ${entry.type} | \`${entry.placeholder}\` |`),
    '',
    '## 代码排版修复',
    '',
    '只对清单中记录且正文逐行匹配的片段添加代码围栏；代码文本不改动。若源文变更导致不匹配，导入器会报错，避免把其他正文误当作代码。',
    '',
    '| 源文件及行号 | 语言 | 原因 |',
    '| --- | --- | --- |',
    ...repairs.map((repair) => `| ${repair.source}:${repair.startLine}–${repair.endLine} | ${repair.language} | ${repair.reason} |`),
    '',
    '## 图片排版修复',
    '',
    '仅移除清单中记录且原始行完全匹配的独立图片行缩进，避免图片被渲染为代码块；图片链接、查询参数与片段保留。列表中的图片及围栏中的 Markdown 示例不做统一去缩进。源文不匹配或目标位于代码围栏内时，导入器会报错。',
    '',
    '| 源文件及行号 | 原因 |',
    '| --- | --- |',
    ...imageRepairs.map((repair) => `| ${repair.source}:${repair.line} | ${repair.reason} |`),
    '',
    '## 原文完整性与再次导入',
    '',
    '下列 SHA-256 在导入前后相同。导入器只更新 `scripts/note-catalog.mjs` 清单中的文章与本报告；不会清空内容目录，后续直接添加的新文章保持不变。',
    '调整已导入文章的元数据时修改清单；调整正文时修改对应源文件并重新导入。直接修改生成的导入文章会被下次导入覆盖。',
    '',
    '| 原始文件 | SHA-256 |',
    '| --- | --- |',
    ...notes.map((note) => `| ${note.source} | \`${note.sourceHash}\` |`),
    '',
  ];
  return text.join('\n');
}

/** Update only catalog-owned destinations; never clean the article directory. */
export async function importNotes({ rootDir = projectRoot, catalog = NOTE_CATALOG } = {}) {
  const outputDir = path.join(rootDir, 'src/content/notes');
  const notes = [];
  await mkdir(outputDir, { recursive: true });
  for (const entry of catalog) {
    const sourcePath = path.join(rootDir, entry.source);
    const bytes = await readFile(sourcePath);
    const original = bytes.toString('utf8');
    const result = transformNote(original, {
      externalLinkBase: entry.externalLinkBase,
      missingAssetDescriptions: entry.missingAssetDescriptions,
      codeBlockRepairs: entry.codeBlockRepairs,
      imageIndentationRepairs: entry.imageIndentationRepairs,
      assetExists: (asset) => existsSync(path.resolve(path.dirname(sourcePath), decodeURIComponent(asset.split(/[?#]/)[0]))),
    });
    const frontmatter = Object.entries(entry.metadata).filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    await writeFile(path.join(outputDir, entry.slug + '.md'), `---\n${frontmatter}\n---\n\n${result.body}`, 'utf8');
    const sourceHash = sha256(bytes);
    if (sha256(await readFile(sourcePath)) !== sourceHash) {
      throw new Error(`原始笔记在导入期间发生变化，请重新运行：${entry.source}`);
    }
    const { body, ...details } = result;
    notes.push({
      slug: entry.slug,
      source: entry.source,
      title: entry.metadata.title,
      sourceHash,
      sourceBytes: bytes.length,
      sourceLines: original.split(/\r\n|\n|\r/).length - (/[\r\n]$/.test(original) ? 1 : 0),
      ...details,
    });
  }
  await mkdir(path.join(rootDir, 'docs'), { recursive: true });
  await writeFile(path.join(rootDir, 'docs/content-migration.md'), renderReport(notes), 'utf8');
  return { notes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { notes } = await importNotes();
  const missing = notes.reduce((sum, note) => sum + note.missingAssets.length, 0);
  const redacted = notes.reduce((sum, note) => sum + note.redactions.length, 0);
  console.log(`Imported ${notes.length} notes; ${missing} missing local images; ${redacted} configuration values replaced. See docs/content-migration.md.`);
}
