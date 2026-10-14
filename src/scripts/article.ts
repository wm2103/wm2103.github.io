const body = document.querySelector<HTMLElement>('#article-body');
if(body) {
  body.querySelectorAll('table').forEach(table => {
    const wrapper=document.createElement('div'); wrapper.className='table-scroll'; wrapper.tabIndex=0; wrapper.setAttribute('role','region'); wrapper.setAttribute('aria-label','可横向滚动的表格');
    table.replaceWith(wrapper); wrapper.append(table);
  });
  body.querySelectorAll<HTMLPreElement>('pre').forEach(pre => {
    const code=pre.querySelector('code'); if(!code) return;
    pre.tabIndex=0;
    const button=document.createElement('button');button.className='copy-code';button.textContent='复制代码';button.setAttribute('aria-label','复制代码块');
    button.addEventListener('click',async()=>{
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        button.textContent='已复制';button.setAttribute('aria-label','代码已复制');
      } catch {
        const range=document.createRange();range.selectNodeContents(code);
        const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);
        button.textContent='请按 Ctrl / ⌘ C';
      }
      window.setTimeout(()=>{button.textContent='复制代码';button.setAttribute('aria-label','复制代码块');},2500);
    });
    pre.append(button);
  });
  function imageFallback(img: HTMLImageElement) {
    if(!img.isConnected) return;
    const panel=document.createElement('span');panel.className='image-fallback';
    const label=document.createElement('span');label.textContent='这张笔记配图暂时无法加载';
    const link=document.createElement('a');link.href=img.src;link.target='_blank';link.rel='noopener noreferrer';link.textContent='在新窗口查看原图 ↗';
    panel.append(label,link);img.replaceWith(panel);
  }
  body.querySelectorAll<HTMLImageElement>('img').forEach(img=>{
    img.loading='lazy'; img.decoding='async'; img.referrerPolicy='no-referrer';
    img.addEventListener('error',()=>imageFallback(img),{once:true});
    if(img.complete && img.naturalWidth===0)imageFallback(img);
  });
  const headings=[...body.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id]')];
  const tocLinks=[...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
  const progress=document.querySelector<HTMLElement>('#reading-progress');
  const percent=document.querySelector<HTMLElement>('#reading-percent');
  let scheduled=false;
  function update() {
    scheduled=false;
    const rect=body!.getBoundingClientRect();
    const total=Math.max(1,rect.height-window.innerHeight);
    const ratio=Math.min(1,Math.max(0,-rect.top/total));
    if(progress)progress.style.transform='scaleX('+ratio+')';
    if(percent)percent.textContent=Math.round(ratio*100)+'%';
    let active=headings[0]?.id;
    for(const heading of headings){if(heading.getBoundingClientRect().top<=130)active=heading.id;else break;}
    tocLinks.forEach(link=>{if(decodeURIComponent(link.hash.slice(1))===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
  window.addEventListener('resize',update);
  new ResizeObserver(update).observe(body);
  update();
  document.querySelectorAll<HTMLAnchorElement>('.toc-mobile a').forEach(link=>link.addEventListener('click',()=>{const details=link.closest('details');if(details)details.open=false;}));
}

