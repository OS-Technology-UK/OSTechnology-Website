import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root,'dist');
const pages = JSON.parse(readFileSync(join(root,'content/pages.json'),'utf8'));
const routes = [...pages.map(p=>p.route),'/case-studies','/small-business-technology-review'];
const failures = [];
const check = (condition,message) => { if(!condition) failures.push(message); };
const files = dir => readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);
const htmlFiles = files(out).filter(p=>p.endsWith('.html'));
const routeFile = route => route==='/' ? join(out,'index.html') : join(out,route.slice(1)+(route.endsWith('.html')?'':'.html'));
for(const route of routes) {
  const file=routeFile(route);check(existsSync(file),`Missing route ${route}`);
  if(existsSync(file))check(readFileSync(file,'utf8').includes(`rel="canonical" href="https://ostechnology.uk${route}"`),`Canonical changed: ${route}`);
  if(route!=='/' && existsSync(file)) check(readFileSync(file,'utf8')===readFileSync(join(out,route.slice(1),'index.html'),'utf8'),`Clean-URL copy differs: ${route}`);
  check(readFileSync(join(out,'sitemap.xml'),'utf8').includes(`<loc>https://ostechnology.uk${route}</loc>`),`Route missing from sitemap: ${route}`);
}
let linkCount=0,schemaCount=0;
for(const file of htmlFiles) {
  const html=readFileSync(file,'utf8');
  check(!/\b(?:quotations?|quoted|quotes?)\b/i.test(html),`Old estimate terminology: ${file}`);
  check(!/(?:six|6)[ -]month(?:s)?\s+minimum|minimum\s+(?:contract\s+)?term[^<]*\b(?:six|6)\b|30 days.{0,20}notice to cancel/i.test(html),`Unsupported contract wording: ${file}`);
  check(!/legacy-content|certified Microsoft|tel:|"telephone"|07942\s*942\s*662|\+447942942662|data-contact-type="tel"|dedicated response times/i.test(html),`Obsolete content: ${file}`);
  check(!/\b(?:TODO|TBD|lorem ipsum|coming soon)\b/i.test(html),`Placeholder content: ${file}`);
  check((html.match(/<h1\b/g)||[]).length===1,`Expected one H1: ${file}`);
  check((html.match(/class="site-header"/g)||[]).length===1 && (html.match(/class="site-footer"/g)||[]).length===1,`Shared shell missing: ${file}`);
  check(/<nav[^>]+class="site-nav"[^>]*>[\s\S]*?href="\/case-studies"/.test(html),`Case studies navigation missing: ${file}`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);check(new Set(ids).size===ids.length,`Duplicate IDs: ${file}`);
  for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {try{JSON.parse(m[1]);schemaCount++}catch{failures.push(`Invalid structured data: ${file}`)}}
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];check(Boolean(canonical),`Missing canonical: ${file}`);
  for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    let url;try{url=new URL(m[1],canonical)}catch{failures.push(`Invalid URL ${m[1]} in ${file}`);continue}
    if(url.origin!=='https://ostechnology.uk')continue;
    linkCount++;
    let target=join(out,url.pathname.slice(1));
    if(url.pathname==='/')target=join(out,'index.html');
    else if(!/\.[a-z0-9]+$/i.test(url.pathname))target=routeFile(url.pathname.replace(/\/$/,''));
    check(existsSync(target),`Missing link/asset ${url.pathname} in ${file}`);
    if(url.hash && existsSync(target) && target.endsWith('.html'))check(readFileSync(target,'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`Missing anchor ${url.pathname}${url.hash} in ${file}`);
  }
}
for(const [hub,count] of [['industries',10],['locations',12]]) {
  const html=readFileSync(join(out,hub+'.html'),'utf8');
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  check(new Set([...main.matchAll(new RegExp(`href="(/${hub}/[^"]+)"`,'g'))].map(m=>m[1])).size===count,`${hub}: expected ${count} child links`);
}
for(const article of pages.filter(p=>p.route.startsWith('/blog/'))) {
  const html=readFileSync(routeFile(article.route),'utf8');
  check(html.includes(`datetime="${article.dateIso}"`),`Article date changed: ${article.route}`);
}
const home=readFileSync(join(out,'index.html'),'utf8');
check(/<h1>Get online\. <em>Get on with business\.<\/em><\/h1>/.test(home),'Business technology homepage missing');
check(home.includes('<title>OS Technology | Websites, Microsoft 365 &amp; IT Services</title>'),'Homepage SEO title missing');
check(home.includes('content="Website design, professional business email, Microsoft 365, hosting and IT support for small businesses. Based in Beverley, serving East Yorkshire and the UK."'),'Homepage SEO description missing');
check(/class="hero-actions"><a class="button button-primary" href="#contact">Contact us/.test(home),'Homepage contact CTA missing');
const titles = ['Websites &amp; Digital Presence','Business Email &amp; Microsoft 365','Hosting &amp; Managed Services','IT Support &amp; Cybersecurity'];
for(const [label,html] of [['homepage',home.match(/<div class="service-list">([\s\S]*?)<\/section>/)?.[1] || ''],['services',readFileSync(routeFile('/services/business'),'utf8').match(/<div class="content-grid service-groups">([\s\S]*?)<\/section>/)?.[1] || '']]) {
  const positions=titles.map(title=>html.indexOf(title));
  check(positions.every((position,i)=>position>=0 && (i===0 || position>positions[i-1])),`Primary service order incorrect: ${label}`);
}
const expectedChoices=['Website or online presence','Business email or Microsoft 365','Existing website, email or domain','IT support or cybersecurity','Something else'];
check((home.match(/data-support-choice/g)||[]).length===5,'Expected five enquiry choices');
for(const choice of expectedChoices) {
  check(home.includes(`href="#contact" data-support-choice data-enquiry-service="${choice}"`),`Contact fallback missing: ${choice}`);
  check(home.includes(`<option>${choice}</option>`),`Enquiry option missing: ${choice}`);
}
for(const slug of ['website-design','business-email','microsoft-365-migration','hosting-domains']) {
  const route='/services/business/'+slug;
  const meta=pages.find(p=>p.route===route);
  check(Boolean(meta),`New service metadata missing: ${route}`);
  const html=readFileSync(routeFile(route),'utf8');
  check(html.includes(`/services/business/web-presence`),`Overview link missing: ${route}`);
  check(readFileSync(routeFile('/services/business/web-presence'),'utf8').includes(`href="${route}"`),`Overview child link missing: ${route}`);
  check(readFileSync(join(out,'llms.txt'),'utf8').includes(route),`Discovery link missing: ${route}`);
  if(meta)check(html.includes(`<title>${meta.title.replaceAll('&','&amp;')}</title>`),`New service title missing: ${route}`);
}
for(const route of ['/services/business/web-presence','/services/business/website-design']) {
  const html=readFileSync(routeFile(route),'utf8');
  const pricing=html.match(/<section class="content-section" id="website-pricing">([\s\S]*?)<\/section>/)?.[1] || '';
  for(const phrase of ['Simple business websites from £100','one responsive brochure page','your supplied content','business information and contact details','OS Technology hosting is required from £10/month','Domains and email cost extra','No VAT is charged','enquiry forms','content creation','Complete business setup — tailored estimate','Existing website modernisation — tailored estimate'])check(pricing.includes(phrase),`Pricing condition missing on ${route}: ${phrase}`);
}
for(const file of htmlFiles) {
  const html=readFileSync(file,'utf8');
  check(!/Most Popular/i.test(html),`Unsupported popularity emphasis: ${file}`);
  if(!file.endsWith('404.html'))check(html.includes('id="business-name" name="business_name" autocomplete="organization"'),'Optional business name missing: '+file);
}
check(/class="signal-strip"/.test(home),'Proof strip missing');
const proof=home.match(/<section class="signal-strip"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
check((proof.match(/<a /g)||[]).length===2,'Expected two selected project results');
check(!/password manager|Microsoft relationship|CSP indirect reseller/.test(proof),'Unrelated homepage proof remains');
const featured=home.match(/<div class="case-grid">([\s\S]*?)<\/section>/)?.[1] || '';
check(!/password manager/.test(featured),'Password-manager work still featured on homepage');
const business=readFileSync(routeFile('/services/business'),'utf8');
check(business.includes('<th scope="row">Remote support</th><td>1 hour free across the business</td><td>Included</td><td>Unlimited, subject to fair use</td>'),'Business remote support allowances incorrect');
check(business.includes('No minimum contract term.'),'Business no-minimum term missing');
const cases=readFileSync(join(out,'case-studies.html'),'utf8');
for(const slug of ['accountant-website-rebuild-microsoft-365-migration','multiple-business-emails-one-microsoft-365-tenant','multiple-business-passwords-one-password-manager']) {
  check(cases.includes(`/blog/${slug}`),`Case study missing: ${slug}`);
  check(readFileSync(routeFile('/blog/'+slug),'utf8').includes('href="/case-studies"'),`Reciprocal case link missing: ${slug}`);
}
const homeSupport=readFileSync(routeFile('/services/home'),'utf8');
for(const price of ['£14.99','£24.99'])check(homeSupport.includes(price),`Home price missing: ${price}`);
check(readFileSync(routeFile('/services/business/web-presence'),'utf8').includes('£10 per month'),'Existing web price missing');
check(!/certified Microsoft|tel:|07942|telephone/i.test(readFileSync(join(out,'llms.txt'),'utf8')),'Obsolete discovery content');
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS: ${routes.length} routes, ${htmlFiles.length} HTML files, ${linkCount} local links/assets and ${schemaCount} valid structured-data blocks. Hubs, dates, prices and project links verified.`);
