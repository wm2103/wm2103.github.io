import type { APIRoute } from 'astro';
import { allNotes, noteUrl } from '../lib/notes';
const xml=(text:string)=>text.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export const GET: APIRoute = async ({site}) => {
  const notes=await allNotes();
  const items=notes.map(note=>{
    const url=new URL(noteUrl(note),site).href;
    const date=note.data.date || note.data.importedAt;
    return '<item><title>'+xml(note.data.title)+'</title><link>'+xml(url)+'</link><guid>'+xml(url)+'</guid><description>'+xml(note.data.description)+'</description>'+(date?'<pubDate>'+date.toUTCString()+'</pubDate>':'')+'</item>';
  }).join('');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>onlylo · 学习笔记</title><link>'+site+'</link><description>记录所学，创造所想。</description><language>zh-CN</language>'+items+'</channel></rss>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
