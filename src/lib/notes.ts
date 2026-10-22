import { getCollection, type CollectionEntry } from 'astro:content';
import { plainText } from './search.mjs';
export { categories, categoryDefinitions, categoryNames, categorySlugs } from './categories';
export type Note = CollectionEntry<'notes'>;
export const noteUrl = (note: Note) => '/notes/' + note.id + '/';
export const formatDate = (date?: Date) => date?.toISOString().slice(0, 10) || '';
export function dateLabel(note: Note) {
  return note.data.date ? formatDate(note.data.date) : note.data.importedAt ? '整理于 ' + formatDate(note.data.importedAt) : '学习笔记';
}
export function readingMinutes(note: Note) {
  const text = plainText(note.body || '');
  return Math.max(1, Math.ceil(text.length / 650));
}
export async function allNotes() {
  return (await getCollection('notes', ({ data }) => !data.draft)).sort((a, b) => {
    const time = (n: Note) => (n.data.date || n.data.importedAt)?.getTime() || 0;
    return time(b) - time(a) || (b.data.seriesOrder || 0) - (a.data.seriesOrder || 0) || a.id.localeCompare(b.id);
  });
}
export async function seriesNotes() {
  return (await allNotes()).filter(n => n.data.series === 'sky-takeout').sort((a, b) => (a.data.seriesOrder || 0) - (b.data.seriesOrder || 0));
}
