/** @param {string} markdown */
export function plainText(markdown) {
  return markdown.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#*_~\x60>|]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
/** @template {{title:string,tags:string[],text:string,category:string}} T
 * @param {T[]} notes @param {string} query @returns {T[]} */
export function searchNotes(notes, query) {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return notes;
  return notes.filter(note => {
    const content = [note.title, ...note.tags, note.category, note.text].join(' ').toLocaleLowerCase();
    return tokens.every(token => content.includes(token));
  }).sort((a, b) => {
    const score = (note) => tokens.reduce((sum, token) => sum + (note.title.toLocaleLowerCase().includes(token) ? 2 : 0) + (note.tags.join(' ').toLocaleLowerCase().includes(token) ? 1 : 0), 0);
    return score(b) - score(a);
  });
}
