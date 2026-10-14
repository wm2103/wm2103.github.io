import type { APIRoute } from 'astro';
import { allNotes, noteUrl } from '../lib/notes';
export const GET: APIRoute = async ({site}) => {
  const urls=['/','/notes/','/projects/','/about/','/series/sky-takeout/',...(await allNotes()).map(noteUrl)];
  const body=urls.map(path=>'<url><loc>'+new URL(path,site).href+'</loc></url>').join('');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+body+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
