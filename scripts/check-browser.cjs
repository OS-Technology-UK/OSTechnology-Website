const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SITE_BROWSER_MODULE || 'playwright');
const root=process.cwd(), out=path.join(root,'dist'), shots=path.join(root,'.sites-runtime/refresh-checks');fs.mkdirSync(shots,{recursive:true});
const routes=[...JSON.parse(fs.readFileSync('content/pages.json','utf8')).map(p=>p.route),'/case-studies','/small-business-technology-review','/404'];
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');let target=path.join(out,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname).slice(1));if(!path.extname(target))target+='.html';if(!target.startsWith(out+path.sep)||!fs.existsSync(target)){res.writeHead(404);res.end();return;}const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true});const ctx=await browser.newContext();
  await ctx.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const page=await ctx.newPage();const failures=[],pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));let checks=0;
  const inspect=async(route,width,theme)=>{
    await page.setViewportSize({width,height:960});await page.goto(origin+route,{waitUntil:'load'});
    await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto'},theme);
    const r=await page.evaluate(()=>{
      const ratio=(a,b)=>{const luminance=c=>{let v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};let x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      return{overflow:document.documentElement.scrollWidth>innerWidth+1,wide:[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().right>innerWidth+2&&!n.closest('.table-scroll')&&getComputedStyle(n).display!=='none').slice(0,5).map(n=>n.tagName+'.'+n.className),images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),h1:document.querySelectorAll('main h1').length,contrast:[...document.querySelectorAll('.button-primary,.button-dark,.nav-cta')].filter(n=>n.getBoundingClientRect().width).map(n=>({text:n.textContent.trim(),ratio:ratio(getComputedStyle(n).color,getComputedStyle(n).backgroundColor)})).filter(n=>n.ratio<4.5),unlabelled:[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]),select,textarea')].filter(n=>!n.labels?.length&&!n.getAttribute('aria-label')).map(n=>n.id)};
    });
    if(r.overflow||r.images.length||r.h1!==1||r.contrast.length||r.unlabelled.length)failures.push({route,width,theme,...r});checks++;
  };
  for(const width of [320,1440])for(const theme of ['light','dark'])for(const route of routes)await inspect(route,width,theme);
  const representatives=['/','/about','/partners','/services/business','/services/home','/industries','/industries/it-support-for-accountants','/industries/it-support-for-recruitment-agencies','/locations/it-support-beverley','/case-studies','/services/business/web-presence','/services/business/website-design','/services/business/business-email','/services/business/microsoft-365-migration','/services/business/hosting-domains','/small-business-technology-review','/blog/accountant-website-rebuild-microsoft-365-migration'];
  for(const theme of ['light','dark'])for(const route of representatives)await inspect(route,768,theme);
  for(const [route,width,theme,name] of [['/',1440,'light','home-desktop'],['/',320,'dark','home-mobile-dark'],['/case-studies',1440,'dark','case-studies-dark'],['/services/business',768,'light','business-tablet'],['/services/home',320,'light','home-support-mobile'],['/locations/it-support-beverley',1440,'light','beverley-desktop']]){
    await inspect(route,width,theme);await page.screenshot({path:path.join(shots,name+'.png'),fullPage:true});
  }
  for(const [width,theme] of [[1440,'light'],[320,'dark']]) {
    await inspect('/services/business/website-design',width,theme);
    await page.locator('#website-pricing').screenshot({path:path.join(shots,`website-pricing-${width}.png`)});
    await page.goto(origin);await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
    if(width===320)await page.locator('.menu-toggle').click();
    await page.locator('.services-nav summary').click();await page.screenshot({path:path.join(shots,`services-menu-${width}.png`)});
  }
  fs.writeFileSync(path.join(shots,'results.json'),JSON.stringify({checks,failures,pageErrors,interactions:'NOT RUN'},null,2));
  console.log(`Completed ${checks} page/layout checks; checking interactions.`);
  // Keyboard, menu, finder and theme paths. All third-party requests stay blocked.
  await page.setViewportSize({width:320,height:800});await page.goto(origin);
  await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(n=>n===document.activeElement),true);assert.notEqual(await page.locator('.skip-link').evaluate(n=>getComputedStyle(n).outlineStyle),'none');
  await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.site-nav').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.site-nav').isVisible(),false);
  await page.locator('.theme-toggle').click();const theme=await page.locator('html').getAttribute('data-theme');await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
  const enquiryServices=['Website or online presence','Business email or Microsoft 365','Existing website, email or domain','IT support or cybersecurity','Something else'];
  await page.locator('#message').fill('Keep my existing description.');
  for(let i=0;i<5;i++){
    await page.locator('[data-support-choice]').nth(i).click();
    assert.equal(await page.locator('#service').inputValue(),enquiryServices[i]);
    assert.equal(await page.locator('#service').evaluate(n=>n===document.activeElement),true);
    assert.equal(new URL(page.url()).hash,'#contact');
    assert.equal(await page.locator('#message').inputValue(),'Keep my existing description.');
    assert.match(await page.locator('.enquiry-related').nth(i).getAttribute('href'),/^\/services\/business/);
  }
  assert.equal(await page.locator('#business-name').getAttribute('required'),null);
  for(const width of [320,1440]) {
    await page.setViewportSize({width,height:960});await page.goto(origin);
    if(width===320)await page.locator('.menu-toggle').click();
    const summary=page.locator('.services-nav summary');
    await summary.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.services-menu').isVisible(),true);
    await page.keyboard.press('Tab');assert.equal(await page.locator('.services-menu a').first().evaluate(n=>n===document.activeElement),true);
    await page.keyboard.press('Escape');assert.equal(await page.locator('.services-menu').isVisible(),false);assert.equal(await summary.evaluate(n=>n===document.activeElement),true);
    if(width===320){assert.equal(await page.locator('.site-nav').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.site-nav').isVisible(),false);await page.locator('.menu-toggle').click();}
    await summary.click();await page.locator('.services-menu a[href="/services/business/business-email"]').click();assert.match(page.url(),/\/services\/business\/business-email$/);
    if(width===320)assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    await page.goto(origin);if(width===320)await page.locator('.menu-toggle').click();await summary.click();await page.locator('.theme-toggle').click();assert.equal(await page.locator('.services-menu').isVisible(),false);
  }
  const touch=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  await touch.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const touchPage=await touch.newPage();await touchPage.goto(origin);
  await touchPage.locator('.menu-toggle').tap();await touchPage.locator('.services-nav summary').tap();
  await Promise.all([touchPage.waitForURL('**/services/business/hosting-domains'),touchPage.locator('.services-menu a[href="/services/business/hosting-domains"]').tap()]);
  await touch.close();
  await page.setViewportSize({width:320,height:800});await page.goto(origin);await page.locator('.home-secondary a').click();assert.match(page.url(),/\/services\/home$/);assert.equal(await page.locator('main details').count()>0,true);await page.locator('main details summary').first().click();assert.equal(await page.locator('main details').first().getAttribute('open')!==null,true);
  // Empty and invalid forms must never issue a request; simulated replies exercise UI only.
  let submissions=0,submitted;await page.route('https://api.web3forms.com/submit',route=>{submissions++;submitted=route.request().postData();return route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'})});
  await page.locator('#contact-form [type=submit]').click();assert.equal(submissions,0);assert.equal(await page.locator('#contact-form').evaluate(f=>f.checkValidity()),false);
  await page.locator('#name').fill('Local validation');await page.locator('#email').fill('invalid');await page.locator('#message').fill('Simulated browser validation; never transmitted.');await page.locator('#contact-form [type=submit]').click();assert.equal(submissions,0);
  await page.locator('#email').fill('local@example.test');await page.locator('#business-name').fill('Local test business');await page.locator('#service').selectOption('Website or online presence');
  await page.locator('#contact-form').evaluate(form=>{const input=document.createElement('input');input.type='hidden';input.name='h-captcha-response';input.value='';form.append(input)});
  await page.locator('#contact-form [type=submit]').click();assert.equal(submissions,0);assert.equal(await page.locator('#captcha-error').textContent(),'Please complete the captcha.');
  await page.locator('[name="h-captcha-response"]').evaluate(input=>input.value='simulated-local-token');
  await page.locator('#contact-form [type=submit]').click();await page.locator('#form-success').waitFor({state:'visible'});assert.equal(submissions,1);assert.match(submitted,/Local test business/);assert.match(submitted,/Website or online presence/);
  await page.unroute('https://api.web3forms.com/submit');await page.route('https://api.web3forms.com/submit',route=>route.fulfill({status:503,contentType:'application/json',body:'{"success":false}'}));await page.locator('#name').fill('Local validation');await page.locator('#email').fill('local@example.test');await page.locator('#message').fill('Simulated failure; never transmitted.');await page.locator('#contact-form [type=submit]').click();await page.locator('#form-error').waitFor({state:'visible'});
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});await nojs.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());const plain=await nojs.newPage();
  for(const [hub,count]of[['industries',10],['locations',12]]){await plain.goto(origin+'/'+hub);assert.equal(await plain.locator(`main a[href^="/${hub}/"]`).count(),count);assert.equal(await plain.locator('.site-nav').isVisible(),true);assert.equal(await plain.locator(`main a[href^="/${hub}/"]`).first().isVisible(),true);}
  await plain.goto(origin);assert.equal(await plain.locator('[data-support-choice]').count(),5);await plain.locator('[data-support-choice]').first().click();assert.equal(new URL(plain.url()).hash,'#contact');assert.equal(await plain.locator('#service').inputValue(),'');await plain.locator('#service').selectOption('Website or online presence');assert.equal(await plain.locator('#service').inputValue(),'Website or online presence');
  await plain.locator('.services-nav summary').click();assert.equal(await plain.locator('.services-menu').isVisible(),true);await plain.locator('.services-menu a[href="/services/business/web-presence"]').click();assert.match(plain.url(),/\/services\/business\/web-presence$/);
  await nojs.close();await browser.close();server.close();fs.writeFileSync(path.join(shots,'results.json'),JSON.stringify({checks,failures,pageErrors,interactions:'PASS; third-party requests blocked; responses simulated'},null,2));
  console.log(JSON.stringify({checks,failures,pageErrors,interactions:'PASS',screenshots:shots},null,2));assert.equal(failures.length,0,'Browser layout failures');assert.equal(pageErrors.length,0,'Browser script errors');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
