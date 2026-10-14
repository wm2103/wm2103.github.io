import type { APIRoute } from 'astro';
import { allNotes, categoryNames, noteUrl } from '../lib/notes';
import { plainText } from '../lib/search.mjs';
export const GET: APIRoute = async () => new Response(JSON.stringify((await allNotes()).map(note=>({
  title:note.data.title, url:noteUrl(note), category:categoryNames[note.data.category],
  tags:note.data.tags, description:note.data.description, text:plainText(note.body || '')
}))),{headers:{'Content-Type':'application/json; charset=utf-8'}});
