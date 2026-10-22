import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative, sep } from 'node:path';
import { NOTE_CATALOG } from '../../scripts/note-catalog.mjs';
const root=resolve('dist');
const configuredUmamiWebsiteId=process.env.UMAMI_WEBSITE_ID?.trim();
async function html(path){return readFile(join(root,path,'index.html'),'utf8');}
async function filesUnder(dir, extension) {
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())files.push(...await filesUnder(path,extension));
    else if(entry.name.endsWith(extension))files.push(path);
  }
  return files;
}
async function index(){return JSON.parse(await readFile(join(root,'search-index.json'),'utf8'));}
test('Umami tracking is emitted only for a configured production website',async()=>{
  const pages=[await html(''),await html('notes/umami-cloud-analytics')];
  for(const source of pages){
    const tracker=source.match(/<script\b[^>]*src="https:\/\/cloud\.umami\.is\/script\.js"[^>]*>/)?.[0];
    if(!tracker){
      if(configuredUmamiWebsiteId) assert.fail('configured Umami tracker is missing');
      continue;
    }
    const websiteId=tracker.match(/data-website-id="([^"]+)"/)?.[1];
    assert.ok(websiteId?.trim());
    if(configuredUmamiWebsiteId){
      assert.equal(websiteId,configuredUmamiWebsiteId);
    }
    assert.ok(tracker.includes('data-domains="wm2103.github.io"'));
    assert.ok(tracker.includes('data-exclude-search="true"'));
    assert.ok(tracker.includes('data-do-not-track="true"'));
    assert.ok(tracker.includes('data-auto-track="false"'));
    assert.ok(tracker.includes('onload="window.umami?.track()"'));
  }
});
test('published note files match the search index; drafts stay private',async()=>{
  const expected=[];
  const directory=resolve('src/content/notes');
  for(const path of await filesUnder(directory,'.md')){
    const source=await readFile(path,'utf8');
    const frontmatter=source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
    if(/^\s*draft:\s*true\s*(?:#.*)?$/m.test(frontmatter))continue;
    expected.push('/notes/'+relative(directory,path).split(sep).join('/').replace(/\.md$/,'')+'/');
  }
  assert.deepEqual((await index()).map(n=>n.url).sort(),expected.sort());
});
test('imported notes retain full body and original fenced code where present',async()=>{
  const entries=await index();
  for(const imported of NOTE_CATALOG){
    const note=entries.find(n=>n.url==='/notes/'+imported.slug+'/');
    if(!note)continue; // A historical imported note can later be marked draft.
    assert.ok(note.text.length>2000,note.title+' must contain complete imported body');
    const source=await html(note.url);
    assert.ok(source.includes('id="article-body"'));
    if(imported.slug !== 'vue-spring-boot')assert.ok(source.includes('astro-code'),note.title);
    assert.ok(!source.includes('&lt;font style='));
    const markdown=await readFile(resolve('src/content/notes',imported.slug+'.md'),'utf8');
    const expectedImages=[...markdown.matchAll(/https:\/\/cdn\.nlark\.com\/[^\s)<>"']+/g)].map(match=>match[0]);
    const actualImages=[...source.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));
    for(const url of expectedImages)assert.ok(actualImages.includes(url),imported.slug+' must render each imported image as an image');
  }
});
test('series entries reflect published series notes in study order',async()=>{
  const entries=await index();
  const publishedDays=NOTE_CATALOG.filter(n=>n.metadata.series && entries.some(e=>e.url==='/notes/'+n.slug+'/'));
  const series=await html('series/sky-takeout');
  for(const day of publishedDays)assert.ok(series.includes('/notes/'+day.slug+'/'));
  assert.ok(series.includes('没有独立讲义或笔记'));
});
test('legacy note URLs redirect to stable new routes',async()=>{
  for(const [old,target]of [['2024/04/10/神经网络','neural-network'],['2024/04/27/vue springboot 黑马','vue-spring-boot']]){
    const source=await html(old);assert.ok(source.includes('http-equiv="refresh"'));assert.ok(source.includes('/notes/'+target+'/'));
  }
});
test('site-owned local links and assets resolve',async()=>{
  const missing=[];
  for(const page of await filesUnder(root,'.html')){
    const source=await readFile(page,'utf8');
    for(const match of source.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)){
      const url=new URL(match[1],'https://onlylo.local');
      let target=join(root,decodeURIComponent(url.pathname));
      try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);}
      catch{missing.push({page:page.slice(root.length),url:match[1]});}
    }
  }
  assert.deepEqual(missing,[]);
});
test('RSS and sitemap cover the current published collection',async()=>{
  const entries=await index();
  const rss=await readFile(join(root,'rss.xml'),'utf8'),sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
  assert.equal((rss.match(/<item>/g)||[]).length,entries.length);
  for(const note of entries){assert.ok(rss.includes(note.url));assert.ok(sitemap.includes(note.url));}
});
test('article images defer requests until near the viewport', async()=>{
  for(const entry of await index()){
    const source=await html(entry.url);
    for(const [img] of source.matchAll(/<img\b[^>]*>/g)){
      assert.match(img,/loading="lazy"/,entry.url);
      assert.match(img,/decoding="async"/,entry.url);
      assert.match(img,/referrerpolicy="no-referrer"/,entry.url);
    }
  }
});

