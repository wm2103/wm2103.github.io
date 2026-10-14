"""Browser smoke checks. Run production preview on port 4321, then:
python scripts/verify-browser.py
Requires Python Playwright and local Chrome.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4321'
OUTPUT = Path('docs/verification')
OUTPUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='chrome')
    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce', permissions=['clipboard-read','clipboard-write'])
    # Deterministic offline-media check; no assumption that remote diagrams load.
    context.route('https://cdn.nlark.com/**', lambda route: route.abort())
    page = context.new_page()
    page.set_default_timeout(8000)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until='domcontentloaded')
    expect(page.locator('.post')).to_have_count(8)
    page.locator('[data-filter="ai"]').click()
    expect(page.locator('.post:visible')).to_have_count(1)
    page.locator('[data-filter="web"]').click()
    expect(page.locator('.post:visible')).to_have_count(7)
    page.locator('[data-filter="all"]').click()
    expect(page.locator('.post:visible')).to_have_count(8)
    page.locator('[data-search]').click()
    expect(page.locator('.search-result')).to_have_count(8)
    page.locator('#search-input').fill('ThreadLocal')
    expect(page.locator('.search-result').first).to_be_visible()
    assert '员工' in page.locator('.search-result').first.inner_text()
    page.locator('#search-input').fill('not-a-real-keyword-xyz')
    expect(page.locator('.search-empty')).to_be_visible()
    page.locator('#search-input').fill('反向传播')
    expect(page.locator('.search-result')).to_have_count(1)
    page.locator('.search-result').click()
    expect(page).to_have_url(BASE+'/notes/neural-network/')
    expect(page.locator('#article-body')).to_be_visible()
    expect(page.locator('.copy-code').first).to_be_visible()
    first_code = page.locator('.prose pre code').first.inner_text()
    page.locator('.copy-code').first.click()
    expect(page.locator('.copy-code').first).to_have_text('已复制')
    assert page.evaluate('navigator.clipboard.readText()').replace('\r\n','\n') == first_code.replace('\r\n','\n')
    assert page.locator('.image-fallback').count() > 0
    toc = page.locator('.article-aside .toc a').nth(3)
    target = toc.get_attribute('href')
    toc.click()
    assert page.url.endswith(target) or page.evaluate('decodeURIComponent(location.hash)') == target
    page.locator('#theme-toggle').click()
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    page.locator('#theme-toggle').click()
    page.goto(BASE+'/notes/?tag=Redis',wait_until='domcontentloaded')
    expect(page.locator('.post:visible')).to_have_count(2)
    page.locator('#clear-tag').click()
    expect(page.locator('.post:visible')).to_have_count(8)
    page.goto(BASE+'/notes/?category=ai&tag=Redis',wait_until='domcontentloaded')
    expect(page.locator('#filter-empty')).to_be_visible()
    page.goto(BASE+'/series/sky-takeout/',wait_until='domcontentloaded')
    assert len(page.locator('.series-entry').all()) == 6
    assert [x.inner_text() for x in page.locator('.series-number').all()] == ['01','02','03','05','06','07']
    page.goto(BASE+'/notes/sky-takeout-day03/',wait_until='domcontentloaded')
    assert page.locator('.article-pagination a').nth(1).get_attribute('href') == '/notes/sky-takeout-day05/'
    page.set_viewport_size({'width':390,'height':844})
    page.goto(BASE+'/notes/sky-takeout-day02/',wait_until='domcontentloaded')
    page.locator('.mobile-toc summary').click()
    page.locator('.toc-mobile a').nth(4).click()
    expect(page.locator('.mobile-toc')).not_to_have_attribute('open','')
    assert page.evaluate('scrollY') > 300
    page.evaluate('window.scrollTo(0,0)')
    page.locator('#menu-toggle').click()
    expect(page.locator('#mobile-menu')).to_be_visible()
    page.locator('#mobile-menu a[href="/projects/"]').click()
    expect(page).to_have_url(BASE+'/projects/')
    page.locator('[data-search]').click()
    page.locator('#search-input').fill('Vue')
    expect(page.locator('.search-result').first).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('#search-dialog')).to_be_hidden()
    page.keyboard.press('Control+k')
    expect(page.locator('#search-dialog')).to_be_visible()
    page.locator('#search-dialog [data-close]').click()
    for old,slug in [('/2024/04/10/神经网络/','neural-network'),('/2024/04/27/vue springboot 黑马/','vue-spring-boot')]:
        page.goto(BASE+old,wait_until='domcontentloaded')
        page.wait_for_url('**/notes/'+slug+'/')
    response=page.goto(BASE+'/this-page-does-not-exist/',wait_until='domcontentloaded')
    assert response.status == 404
    expect(page.locator('.not-found')).to_be_visible()
    widths=[]
    pages=['/','/notes/','/series/sky-takeout/','/projects/','/about/','/notes/sky-takeout-day02/','/notes/neural-network/']
    for path in pages:
        page.goto(BASE+path,wait_until='domcontentloaded')
        for width in [1920,1440,1024,768,390,360]:
            page.set_viewport_size({'width':width,'height':900})
            size=page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
            assert size['width']==size['scroll'],(path,size)
            widths.append({'path':path,**size})
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(BASE,wait_until='domcontentloaded')
    page.screenshot(path=str(OUTPUT/'home-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(OUTPUT/'home-mobile.png'),full_page=True)
    page.goto(BASE+'/notes/sky-takeout-day02/',wait_until='domcontentloaded')
    page.screenshot(path=str(OUTPUT/'article-mobile.png'))
    page.set_viewport_size({'width':1440,'height':1000})
    page.screenshot(path=str(OUTPUT/'article-desktop.png'))
    assert not errors,errors
    report={'result':'passed','viewport_checks':len(widths),'page_errors':errors,'external_images':'requests blocked deliberately to verify fallback','checks':['filters','query parameters','search title/tags/body','empty search','search navigation','clipboard','theme persistence','desktop/mobile TOC','mobile menu','series gaps and navigation','legacy redirects','404','responsive layouts']}
    (OUTPUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True))
    browser.close()

