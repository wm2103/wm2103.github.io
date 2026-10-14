import { searchNotes } from '../lib/search.mjs';
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
const themeToggle = $<HTMLButtonElement>('#theme-toggle');
function reflectTheme() {
  themeToggle?.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
}
reflectTheme();
themeToggle?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme; reflectTheme();
  try { localStorage.setItem('onlylo-theme', theme); } catch {}
});
const menu = $('#mobile-menu'), menuToggle = $('#menu-toggle');
const closeMenu = () => { if(menu) menu.hidden = true; menuToggle?.setAttribute('aria-expanded','false'); };
menuToggle?.addEventListener('click', () => { if(menu) { menu.hidden = !menu.hidden; menuToggle.setAttribute('aria-expanded', String(!menu.hidden)); } });
document.addEventListener('click', e => { if(e.target instanceof Node && !menu?.contains(e.target) && !menuToggle?.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuToggle?.focus(); } });

const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
const cards = [...document.querySelectorAll<HTMLElement>('[data-category]')];
if (filters.length) {
  const params = new URLSearchParams(location.search);
  let category = ['all','web','ai'].includes(params.get('category') || '') ? params.get('category')! : 'all';
  let tag = params.get('tag') || '';
  function applyFilter(updateUrl = false) {
    let count = 0;
    cards.forEach(card => { const tags: string[] = JSON.parse(card.dataset.tags || '[]'); card.hidden = (category !== 'all' && card.dataset.category !== category) || (!!tag && !tags.includes(tag)); if(!card.hidden) count++; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    const counter = $('#filter-count'); if(counter) counter.textContent = '共 ' + count + ' 篇';
    const empty = $('#filter-empty'); if(empty) empty.hidden = count > 0;
    const active = $('#active-tag');
    if(active) { active.hidden = !tag; const label = active.querySelector('span'); if(label) label.textContent = '标签：' + tag; }
    if(updateUrl) {
      const query = new URLSearchParams();
      if(category !== 'all') query.set('category', category);
      if(tag) query.set('tag', tag);
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query : '') + location.hash);
    }
  }
  filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter!; applyFilter(true); }));
  $('#clear-tag')?.addEventListener('click', () => { tag = ''; applyFilter(true); });
  applyFilter();
}
type SearchEntry = { title:string; url:string; tags:string[]; category:string; text:string; description:string; };
const dialog = $<HTMLDialogElement>('#search-dialog');
const input = $<HTMLInputElement>('#search-input');
const results = $('#search-results'), count = $('#search-count');
let notes: SearchEntry[] | undefined;
let loading: Promise<void> | undefined;
let opener: HTMLElement | null = null;
let requestId = 0;
function renderResults() {
  if(!notes || !input || !results || !count) return;
  const query = input.value.trim();
  const matches = searchNotes(notes, query);
  count.textContent = query ? '找到 ' + matches.length + ' 篇笔记' : '共 ' + notes.length + ' 篇笔记 · 可搜索正文';
  results.replaceChildren();
  if(!matches.length) { const p = document.createElement('p'); p.className='search-empty'; p.textContent='没有找到相关内容，换个关键词试试。'; results.append(p); }
  matches.slice(0,30).forEach(note => {
    const a = document.createElement('a'); a.href=note.url; a.className='search-result';
    const copy = document.createElement('span'); copy.className='result-copy';
    const title = document.createElement('strong'); title.textContent=note.title;
    const meta = document.createElement('small'); meta.textContent=note.category + ' · ' + note.tags.join(' / ');
    const excerpt = document.createElement('span'); excerpt.className='search-excerpt';
    const token = query.toLocaleLowerCase().split(/\s+/).find(t=>note.text.toLocaleLowerCase().includes(t));
    const start = token ? Math.max(0, note.text.toLocaleLowerCase().indexOf(token)-35) : -1;
    excerpt.textContent = start >= 0 ? (start ? '…' : '') + note.text.slice(start,start+130) + '…' : note.description;
    copy.append(title,meta,excerpt); a.append(copy); results.append(a);
  });
}
async function loadSearch() {
  if(notes) { renderResults(); return; }
  if(loading) return loading;
  const current = ++requestId;
  if(count) count.textContent='正在加载笔记索引…';
  loading = (async () => {
    try {
      const response = await fetch('/search-index.json');
      if(!response.ok) throw new Error('search unavailable');
      const data: SearchEntry[] = await response.json();
      if(current !== requestId) return;
      notes = data; renderResults();
    } catch {
      if(count) count.textContent='搜索索引暂时无法加载。';
      if(results) {
        results.replaceChildren();
        const retry=document.createElement('button'); retry.className='search-result'; retry.textContent='重新加载搜索';
        retry.addEventListener('click',()=>void loadSearch());
        const link=document.createElement('a'); link.href='/notes/'; link.className='search-result'; link.textContent='先浏览全部笔记 →';
        results.append(retry,link);
      }
    } finally { loading=undefined; }
  })();
  return loading;
}
function openSearch() {
  if(!dialog || !input) return;
  closeMenu(); opener=document.activeElement as HTMLElement;
  if(!dialog.open) dialog.showModal();
  input.focus(); void loadSearch();
}
document.querySelectorAll('[data-search]').forEach(button => button.addEventListener('click', openSearch));
input?.addEventListener('input',renderResults);
dialog?.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault();dialog.close(); } });
dialog?.addEventListener('close',()=>opener?.focus({preventScroll:true}));
dialog?.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});

