import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cases, escapeHtml as e, hero, renderCustom, renderHome, routeAdditions, serviceGroups, enquiryChoices, websitePricing } from './site-content.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'dist');
const version = '20261016-header-layout-4';
const pages = JSON.parse(readFileSync(join(root, 'content/pages.json'), 'utf8'));
const write = (path, value) => { const target = join(out, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value); };
const schemaText = value => JSON.stringify(value).replace(/</g, '\\u003c');
const company = { '@type': 'Organization', name: 'OS Technology Limited', url: 'https://ostechnology.uk', email: 'hello@ostechnology.uk', description: 'Websites, professional email, Microsoft 365, hosting, cybersecurity and IT support for small businesses. Based in Beverley, East Yorkshire. Microsoft CSP indirect reseller.' };
function nav(route) {
  const contactHref = route==='/404' ? '/#contact' : '#contact';
  const links = [['Our Work','/case-studies'],['About','/about'],['Insights','/blog'],['Contact',contactHref]];
  const services = `<details class="services-nav"><summary>Services</summary><div class="services-menu"><a href="/services/business"${route==='/services/business' ? ' aria-current="page"' : ''}>All business services</a>${serviceGroups.map(s=>`<a href="${s.href}"${route===s.href ? ' aria-current="page"' : ''}>${e(s.title)}</a>`).join('')}</div></details>`;
  return `<header class="site-header"><a class="brand" href="/" aria-label="OS Technology home"><picture><source srcset="/images/logo-mark.webp" type="image/webp"><img class="brand-logo" src="/images/logo-mark-56.png" alt="" width="34" height="34"></picture><span>OS <strong>Technology</strong></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span class="sr-only">Menu</span></button><nav id="site-nav" class="site-nav" aria-label="Main navigation">${services}${links.map(([label,href])=>`<a href="${href}"${route===href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div class="nav-actions"><button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false"><svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg><svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg></button><a class="nav-cta" href="${contactHref}">Contact us ↗</a></div></header>`;
}
function head(m, type = 'website') {
  const canonical = `https://ostechnology.uk${m.route}`;
  const schemas = typeof m.schema === 'string' ? (m.schema ? [JSON.parse(m.schema)] : []) : m.schema;
  const schema = schemas?.length ? { '@context': 'https://schema.org', '@graph': schemas.flatMap(s => s['@graph'] || [s]).map(s => { const copy = {...s}; delete copy['@context']; return copy; }) } : { '@context':'https://schema.org', '@graph':[company, { '@type':'WebPage', name:m.h1 || m.title, description:m.description, url:canonical }] };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script>try{const t=localStorage.getItem('os-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch(e){}</script><title>${e(m.title)}</title><meta name="description" content="${e(m.description)}"><meta name="robots" content="${m.route==='/404' ? 'noindex, follow' : 'index, follow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${type}"><meta property="og:title" content="${e(m.title)}"><meta property="og:description" content="${e(m.description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="OS Technology"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${e(m.title)}"><meta name="twitter:description" content="${e(m.description)}"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png"><link rel="apple-touch-icon" href="/images/apple-touch-icon.png"><link rel="stylesheet" href="/assets/site.css?v=${version}"><script type="application/ld+json">${schemaText(schema)}</script><script src="/assets/site.js?v=${version}" defer></script><script src="/assets/theme.js?v=${version}" defer></script></head>`;
}
function contact(subject = 'New Enquiry — OS Technology') {
  return `<section class="contact-band" id="contact"><div class="contact-copy"><p class="eyebrow">Start here</p><h2>Tell us what needs to work better.</h2><p>No technical diagnosis required. Describe the problem or the plan in your own words and we’ll come back within one business day.</p><div class="contact-direct"><a href="mailto:hello@ostechnology.uk">hello@ostechnology.uk</a></div></div><form class="contact-form" id="contact-form" action="https://api.web3forms.com/submit" method="post" novalidate><input type="hidden" name="access_key" value="2a16637d-d967-4413-9f4f-a87205271ec3"><input type="hidden" name="subject" value="${subject}"><input type="hidden" name="redirect" value="false"><input type="checkbox" name="botcheck" class="honeypot" tabindex="-1" autocomplete="off"><input type="hidden" name="_form_loaded_at" id="_form_loaded_at"><div class="field-row"><label>Full name <input id="name" name="name" autocomplete="name" required></label><label>Email address <input id="email" type="email" name="email" autocomplete="email" required></label></div><label>Business name (optional) <input id="business-name" name="business_name" autocomplete="organization"></label><label>What can we help with? <select id="service" name="service"><option value="">Choose a service</option>${enquiryChoices.map(c=>`<option>${e(c.service)}</option>`).join('')}<option>Home IT support</option></select></label><label>Tell us a little more <textarea id="message" name="message" rows="5" required></textarea></label><div class="h-captcha" data-captcha="true"></div><p id="captcha-error" class="form-note" aria-live="polite"></p><button class="button button-dark" type="submit">Send enquiry <span>↗</span></button><p class="form-note">Your details are used only to respond to this enquiry.</p><p id="form-success" class="form-status success" hidden role="status">Thanks — your message has been sent.</p><p id="form-error" class="form-status error" hidden role="alert">Something went wrong. Please email hello@ostechnology.uk.</p></form></section>`;
}
function footer() {
  return `<footer class="site-footer"><div><a class="brand" href="/"><img class="brand-logo" src="/images/logo-mark-56.png" alt="" width="34" height="34"><span>OS <strong>Technology</strong></span></a><p>Websites, professional email, Microsoft 365, hosting and IT support for small businesses. Based in Beverley, serving East Yorkshire and the UK.</p></div><div><p class="footer-label">Explore</p><a href="/services/business">Business services</a><a href="/services/business/web-presence">Websites &amp; digital presence</a><a href="/services/business/business-email">Business email &amp; Microsoft 365</a><a href="/services/business/hosting-domains">Hosting &amp; domains</a><a href="/case-studies">Our Work</a><a href="/industries">Industries</a><a href="/locations">Locations</a><a href="/small-business-technology-review">Free technology review</a><a href="/services/home">Home Support</a><a href="/partners">Products &amp; partners</a><a href="/blog">Insights</a><a href="/about">About</a></div><div><p class="footer-label">Reach us</p><a href="mailto:hello@ostechnology.uk">hello@ostechnology.uk</a><p>Enquiries: Mon–Fri · 9:00–17:00</p><p>Helpdesk hours depend on your plan.</p></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} OS Technology Limited</span><span>Company No. 17261969 · Beverley, East Riding of Yorkshire</span></div></footer>`;
}
const shell = (m, body, type = 'website') => `${head(m,type)}<body><a class="skip-link" href="#main-content">Skip to content</a>${nav(m.route)}<main id="main-content">${body}</main>${footer()}</body></html>`;
const services = serviceGroups.map((s,i)=>[s.title,s.copy,s.href,String(i+1).padStart(2,'0')]);
function smallBusinessTechnologyReviewPage() {
  const reviewMeta = {
    title: 'Free Small Business Technology Review | OS Technology',
    description: 'A free, plain-English technology review for East Yorkshire businesses that need a more professional, secure and manageable IT setup.',
    route: '/small-business-technology-review',
    schema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: 'Free Small Business Technology Review',
      description: 'A free, plain-English review of business email, domain ownership, passwords, files, devices, backup and security for small businesses in East Yorkshire.',
      price: '0',
      priceCurrency: 'GBP',
      seller: { '@type': 'ProfessionalService', name: 'OS Technology', url: 'https://ostechnology.uk', email: 'hello@ostechnology.uk' },
      areaServed: { '@type': 'AdministrativeArea', name: 'East Yorkshire' }
    })
  };
  const concerns = [
    ['Personal email is doing business work', 'Customer conversations, invoices and company logins live in personal inboxes rather than an account the business controls.'],
    ['Nobody is quite sure who owns what', 'The domain, website, email, social accounts or cloud files may be registered to a former employee, a freelancer or an old personal account.'],
    ['Passwords are scattered', 'Important logins are shared in messages, saved in browsers or known by only one person.'],
    ['Files have grown wherever there was space', 'Documents are split between laptops, USB drives, personal cloud storage and old accounts, with no obvious backup or handover plan.'],
    ['Technology has been added bit by bit', 'Each tool may have solved an immediate problem, but together they are difficult to manage, secure and support.'],
    ['A staff change would create a scramble', 'When someone leaves, it is not clear what access they have, what needs transferring or how the business keeps working.']
  ];
  const coverage = [
    ['Business email & Microsoft 365', 'A professional email setup, clear ownership and the right tools for communication and collaboration.'],
    ['Domains, DNS & website access', 'Who owns the important accounts, how they are secured and whether you can make changes when you need to.'],
    ['Passwords, MFA & access', 'A safer, manageable way to protect sign-ins and control who can reach company systems.'],
    ['Files, backups & recovery', 'Where business information lives, how it is shared and what happens if a device is lost or fails.'],
    ['Devices & day-to-day support', 'Whether laptops, phones and other equipment are set up consistently and ready for the people using them.'],
    ['Your practical next steps', 'A prioritised, plain-English outline of what to fix first, what can wait and where OS Technology can help.']
  ];
  const cards = (items) => items.map(([title, copy]) => `<article class="content-card"><h3>${title}</h3><p>${copy}</p></article>`).join('');
  return shell(reviewMeta, `<header class="route-hero technology-review-hero"><nav class="breadcrumbs"><a href="/">Home</a><span>/</span><span>Small business technology review</span></nav><p class="eyebrow">Free for East Yorkshire businesses</p><h1>Your business has grown. Has your IT grown with it?</h1><p>We help small businesses turn an improvised collection of accounts, devices and subscriptions into a professional setup they can manage with confidence.</p><a class="button button-primary" href="#contact">Book your free review <span>↗</span></a></header><div class="page-content technology-review"><section class="content-section"><div class="container section-heading"><p class="eyebrow">It happens gradually</p><h2>Small gaps become real business risks.</h2><p class="section-lead">Most businesses do not set out with disorganised IT. They grow, solve the next problem quickly and add technology as they need it. Eventually, everyday work becomes harder to manage, less secure and much more difficult to hand over.</p></div><div class="container content-grid">${cards(concerns)}</div></section><section class="content-section"><div class="container section-heading"><p class="eyebrow">The review</p><h2>A clear picture of where you are now.</h2><p class="section-lead">Our free Small Business Technology Review is a practical conversation about the technology your business relies on. There is no scare tactic or jargon-heavy report — just a useful view of what is working, what is exposed and what would make the biggest difference.</p></div><div class="container content-grid">${cards(coverage)}</div></section><section class="content-section process"><div class="container section-heading"><p class="eyebrow">How it works</p><h2>Three straightforward steps.</h2></div><div class="container content-grid"><article class="content-card"><p class="eyebrow">01</p><h3>Tell us how things work today</h3><p>We start with your people, the systems you use and any worries already on your mind. You do not need to prepare a technical inventory.</p></article><article class="content-card"><p class="eyebrow">02</p><h3>We map the important pieces</h3><p>Together, we look at ownership, access, security and how the essentials fit together — from email and files to devices and your website.</p></article><article class="content-card"><p class="eyebrow">03</p><h3>You get sensible priorities</h3><p>We explain what should be addressed first, what can be planned for later and how to make the setup easier to run going forward.</p></article></div></section><section class="content-section"><div class="container section-heading"><p class="eyebrow">What good looks like</p><h2>One company. One point of contact. A proper setup.</h2><p class="section-lead">The aim is not to make your business more complicated. It is to make the technology behind it clear, owned by the business and ready to support the next stage of growth.</p><p><a class="button button-primary" href="#contact">Arrange your free review <span>↗</span></a></p></div></section></div>${contact('Free Small Business Technology Review — OS Technology')}`);
}

function getOnlinePage() {
  const onlineMeta = {
    title: 'Get Your Business Online | Websites, Email & Domains | OS Technology',
    description: 'Get your business properly set up online with a professional website, Microsoft 365 email, a domain, Google Business Profile and ongoing technical support.',
    route: '/services/business/web-presence',
    schema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Get Your Business Online',
      description: 'Professional websites, Microsoft 365 business email, domain and DNS setup, Google Business Profile setup, and ongoing technical support for small businesses.',
      provider: { '@type': 'ProfessionalService', name: 'OS Technology', url: 'https://ostechnology.uk', email: 'hello@ostechnology.uk' },
      areaServed: { '@type': 'Country', name: 'United Kingdom' },
      offers: { '@type': 'Offer', price: '10', priceCurrency: 'GBP', description: 'Web services starting from £10 per month. No VAT is charged. Simple website builds start from £100 one-off, require OS Technology hosting from £10/month, and exclude domain and email costs.' }
    })
  };
  const services = [
    ['A website that represents your business properly', 'A fast, mobile-friendly website built around what you do and the customers you want to reach. We can help with the words, structure, contact options and the practical details that turn a visit into an enquiry.'],
    ['Professional business email', 'Use an address on your own domain, with Microsoft 365 set up securely for you. Whether you are starting fresh or moving from an old inbox, we make the change straightforward.'],
    ['Your own domain and reliable DNS', 'We help register, transfer and manage your domain, then connect it correctly to your website and email. The important accounts stay clearly owned by your business.'],
    ['Google Business Profile setup', 'Make it easier for local customers to find you in Google Search and Maps, with the right business details, service areas, opening hours and website link in place.'],
    ['Ongoing technical support', 'When details change, you are not left trying to work out hosting, email settings or DNS records alone. We remain your point of contact for the technical side.']
  ];
  const cards = services.map(([title, copy]) => `<article class="content-card"><h3>${title}</h3><p>${copy}</p></article>`).join('');
  return shell(onlineMeta, `<header class="route-hero"><nav class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/services/business">Services</a><span>/</span><span>Get your business online</span></nav><p class="eyebrow">Web, email and domains</p><h1>Get your business properly set up online.</h1><p>A website, professional email, your own domain and the support to keep it all working. One friendly, practical place to start.</p><div class="hero-actions"><a class="button button-primary" href="#contact">Tell us what you need <span>↗</span></a><a class="text-link" href="#what-is-included">See what we can help with <span>↓</span></a></div></header><div class="page-content get-online"><section class="content-section" id="what-is-included"><div class="container section-heading"><p class="eyebrow">Everything in one place</p><h2>The essentials your business needs to be found, trusted and ready for work.</h2><p class="section-lead">You do not need to know which platform, domain setting or email licence is right for you. Tell us where you are now and where you want the business to get to, and we will recommend a sensible route.</p></div><div class="container content-grid">${cards}</div><div class="container"><h3>Explore the right service for you</h3><ul class="service-links"><li><a class="text-link" href="/services/business/website-design">Website design ↗</a></li><li><a class="text-link" href="/services/business/business-email">Business email setup ↗</a></li><li><a class="text-link" href="/services/business/microsoft-365-migration">Microsoft 365 migration ↗</a></li><li><a class="text-link" href="/services/business/hosting-domains">Hosting &amp; domain management ↗</a></li></ul></div></section>${websitePricing()}<section class="content-section process"><div class="container section-heading"><p class="eyebrow">How we get you online</p><h2>Simple from first conversation to launch.</h2></div><div class="container content-grid"><article class="content-card"><p class="eyebrow">01</p><h3>Start with your business, and where you want it to go</h3><p>Tell us what you do, who you want to reach and what you already have. A rough idea is enough.</p></article><article class="content-card"><p class="eyebrow">02</p><h3>Get a clear recommendation</h3><p>We outline the right next steps, explain the options plainly and provide a tailored estimate for any website build.</p></article><article class="content-card"><p class="eyebrow">03</p><h3>Launch with the basics covered</h3><p>We connect the website, email, domain and Google profile, then stay available when you need help afterwards.</p></article></div></section><section class="content-section"><div class="container section-heading"><p class="eyebrow">Already have some of it?</p><h2>We can work with the setup you have.</h2><p class="section-lead">Perhaps you have a domain but no website, use a personal email address, or have a site that needs bringing up to date. We can pick up from there, including moving services from an existing provider where appropriate.</p><p><a class="button button-primary" href="#contact" style="color:#101114">Contact us <span>↗</span></a></p></div></section></div>${contact('Get Your Business Online enquiry — OS Technology')}`);
}


const overrides = {
  '/': { title:'OS Technology | Websites, Microsoft 365 & IT Services', h1:'Get online. Get on with business.', description:'Website design, professional business email, Microsoft 365, hosting and IT support for small businesses. Based in Beverley, serving East Yorkshire and the UK.' },
  '/about': { title:'About OS Technology | Small Business Technology from Beverley', h1:'Your business technology. One provider.', description:'Websites, business email, Microsoft 365, hosting and ongoing IT support from OS Technology in Beverley, East Yorkshire.', intro:'Helping small businesses establish, manage and improve their digital setup, from their first website to ongoing support.' },
  '/partners': { h1:'Microsoft licensing and practical security.', intro:'Microsoft CSP indirect reseller services, with security technologies selected around your business needs.' },
  '/services/business': { title:'Websites, Email, Hosting & IT Services | OS Technology', h1:'Everything your business needs, in one place.', description:'Website design, business email, Microsoft 365, hosting, IT support and cybersecurity for small businesses in Beverley, East Yorkshire and across the UK.', intro:'Launch your website, set up professional email, bring your domains and hosting together, and keep your technology working with practical support.' },
  '/industries': { h1:'Business IT for your sector.', intro:'Practical support for the devices, accounts and information your work depends on. Find your industry below.' },
  '/locations': { h1:'Business IT across the East Riding.', intro:'Based in Beverley, with remote support across the region and arranged on-site work when needed. Explore your local coverage below.' }
};
for(const m of pages) if(overrides[m.route]) { Object.assign(m,overrides[m.route]); m.schema=[]; }
pages.push({route:'/case-studies',title:'Our Work | Websites, Email & IT Projects | OS Technology',description:'Documented website, Microsoft 365 and password management projects for small businesses. Read what changed and the results reported.',h1:'Real projects. Practical business improvements.',intro:'Three project write-ups, with specific results and the work behind them.',schema:[]});
const articles = pages.filter(p=>p.route.startsWith('/blog/')).sort((a,b)=>b.dateIso.localeCompare(a.dateIso));
const articleCards = articles.map(a=>`<a class="article-card" href="${a.route}"><div><span>${e(a.category)}</span><time datetime="${e(a.dateIso)}">${e(a.date)}</time></div><h3>${e(a.h1)}</h3><p>${e(a.description)}</p><b>Read article ↗</b></a>`);
function articleServiceLinks(route) {
  const related = {
    '/blog/accountant-website-rebuild-microsoft-365-migration': [['Website design','website-design'], ['Business email setup','business-email'], ['Microsoft 365 migration','microsoft-365-migration']],
    '/blog/multiple-business-emails-one-microsoft-365-tenant': [['Business email setup','business-email'], ['Microsoft 365 migration','microsoft-365-migration'], ['Hosting & domain management','hosting-domains']]
  }[route];
  return related ? `<div class="content-callout"><h2>Help with your own setup</h2><ul>${related.map(([label,slug])=>`<li><a href="/services/business/${slug}">${e(label)} ↗</a></li>`).join('')}</ul></div>` : '';
}
const rendered = [];
for(const m of pages) {
  let page;
  if(m.route==='/') page=shell(m,renderHome(services,articleCards)+contact());
  else if(m.route==='/services/business/web-presence') page=getOnlinePage();
  else if(m.route==='/blog') page=shell(m,`<header class="editorial-hero"><p class="eyebrow">Insights</p><h1>Ideas for safer, simpler technology.</h1><p>Practical guidance on business IT, cybersecurity and Microsoft 365.</p></header><section class="journal-grid" aria-label="Articles">${articleCards.join('')}</section>${contact('Insights enquiry — OS Technology')}`);
  else if(m.route.startsWith('/blog/')) {
    const body=readFileSync(join(root,'content',m.route.slice(1)+'.html'),'utf8');
    const reciprocal=cases.some(c=>c.route===m.route) ? '<div class="content-callout"><h2>More documented projects</h2><p>Explore our website, email and password management work.</p><a href="/case-studies">Browse case studies ↗</a></div>' : '';
    page=shell(m,`<article class="journal-article"><header><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog">Insights</a></nav><p class="eyebrow">${e(m.category)}</p><h1>${e(m.h1)}</h1><div class="article-byline"><time datetime="${e(m.dateIso)}">${e(m.date)}</time><span>OS Technology</span></div></header><div class="article-layout"><aside><p>In this article</p><span>${e(m.category)}</span><a href="#contact">Discuss this with us ↗</a></aside><div class="prose">${body}${reciprocal}${articleServiceLinks(m.route)}</div></div></article>${contact('Insights enquiry — OS Technology')}`,'article');
  } else {
    const custom=renderCustom(m);
    const body=custom ?? `${hero(m)}${m.route==='/services/business/website-design' ? websitePricing() : ''}<div class="page-content">${readFileSync(join(root,'content',m.route.slice(1)+'.html'),'utf8')}</div>${routeAdditions(m.route)}`;
    page=shell(m,body+contact(`${m.h1} enquiry — OS Technology`));
  }
  const path=m.route==='/' ? 'index.html' : m.route.slice(1)+'.html';
  write(path,page); if(m.route!=='/') write(m.route.slice(1)+'/index.html',page); rendered.push(m.route);
}
const review=smallBusinessTechnologyReviewPage();write('small-business-technology-review.html',review);write('small-business-technology-review/index.html',review);rendered.push('/small-business-technology-review');
for(const dir of ['images','media','assets']) if(existsSync(join(root,dir))) cpSync(join(root,dir),join(out,dir),{recursive:true});
for(const path of ['favicon.ico','robots.txt','llms.txt','web.config']) write(path,readFileSync(join(root,path)));
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rendered.map(route=>`  <url><loc>https://ostechnology.uk${route}</loc></url>`).join('\n')}\n</urlset>\n`;
write('sitemap.xml',sitemap);writeFileSync(join(root,'sitemap.xml'),sitemap);
write('404.html',shell({title:'Page not found | OS Technology',description:'The requested page could not be found.',route:'/404'},'<section class="not-found"><p class="eyebrow">404</p><h1>Page not found.</h1><p>Explore business IT or return to the homepage.</p><a class="button button-primary" href="/">Return home ↗</a></section>'));
console.log(`Built ${rendered.length} routes, including ${articles.length} articles, plus clean-URL copies and the 404 page.`);
