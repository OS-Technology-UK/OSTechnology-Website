# OS Technology site refresh

The website builds entirely from local files. No historical Git object, framework or backend is required.

## Editing and previewing

- `content/pages.json` holds existing route metadata, structured data and article dates.
- `content/**/*.html` holds maintained article and detail-page content. Sections, grids, cards, sidebars and native FAQ controls use the shared stylesheet.
- `scripts/site-content.mjs` renders the business technology homepage, About, Partners, managed plans, discovery hubs, project cards and contextual links. It also owns the shared primary service groups, enquiry choices and website pricing section.
- `scripts/build.mjs` owns the document shell, contact form, editorial pages, technology review, web-presence page and output generation.
- `assets/site.css`, `assets/site.js` and `assets/theme.js` contain the shared design and interactive behavior.

Run `npm run build` to regenerate the IIS deployment folder, `dist`. Run `npm run preview` for a local preview at http://127.0.0.1:4173/. The preview server uses the generated directory copies; production clean URLs, redirects and headers remain controlled by the existing `web.config`.

After rebuilding HTML, run `python tools/generate-markdown.py` to refresh the Markdown versions introduced on main. Validate them with `python tools/generate-markdown.py --check` and `python -m unittest discover -s tools -p 'test_*.py'`. These commands require Beautiful Soup and html2text, as described in the README. The build preserves IIS Markdown content negotiation and copies the updated `llms.txt` discovery file into `dist`.

Existing article URLs and dates are retained. The new `/case-studies` hub links to the detailed articles rather than duplicating them. The older `#plans` anchor remains supported alongside `#managed-plans`. Home Support remains available with its existing Personal and Family prices; web services still start from £10 per month.

Founder details, photos, testimonials and new response targets are omitted. Microsoft wording uses the confirmed CSP indirect reseller relationship. No new accreditations, offices, customer counts or arrival guarantees are claimed. The password-manager project is identified as a follow-up for the same client as the ten-domain migration.

## Business technology repositioning — 16 October 2026

The homepage now leads with “Get online. Get on with business.” Websites & Digital Presence, Business Email & Microsoft 365, Hosting & Managed Services, and IT Support & Cybersecurity are the four primary service groups, in that order. The business-services page follows the same hierarchy; devices and strategy remain secondary services.

The navigation is Services, Our Work, About, Insights and Contact, with Contact us as the main CTA. Services uses a native disclosure that works with keyboard, touch and JavaScript disabled; JavaScript adds Escape, focus-leaving and outside-click handling. Industries, Locations and Home Support remain discoverable through the footer and contextual links. Our Work retains `/case-studies`, with the three documented projects described in terms of the problem, work and result.

Four maintained detail pages are registered in `content/pages.json` beneath `/services/business/`: `website-design`, `business-email`, `microsoft-365-migration` and `hosting-domains`. The existing `web-presence` URL remains the flagship overview and links to all four. Related project articles link to the new services. Modern Workplace remains the broader Microsoft 365 service. Each new page has a distinct purpose, title, description, canonical URL, sitemap entry, `.html` output and matching clean-URL copy.

The approved starting offer is **Simple business websites from £100**, a one-off build price for one responsive brochure page using client-supplied content, with business information and contact details. **OS Technology hosting is required from £10/month.** Domains and email cost extra, and **no VAT is charged**. Additional pages, enquiry forms, functionality and content creation are estimated separately. The same pricing renderer appears on the overview and website-design pages, alongside tailored estimates for complete business setup and existing website modernisation. No revision allowance or delivery guarantee has been added.

Owner corrections on 16 October: the results strip contains only the website rebuild and ten-domain email project. The password-manager follow-up is no longer featured as homepage project proof; the original article and case-studies archive remain available. Microsoft reseller status stays on the Partners page rather than being presented as a project result. The strip and featured-work grid accommodate two projects without empty columns.

Customer-facing copy and structured data use **estimates**, and former pricing-enquiry buttons say **Contact us**. Business and home pages have no minimum contract term. The unsupported minimum-term and cancellation-notice wording has been removed from maintained content and structured data. Starter remote support is **1 hour free across the business**, with no allowance period invented; Standard remote support is **Included**. Premium retains its existing fair-use wording.

Header/layout follow-up: the Services disclosure uses a centred CSS chevron rather than a font glyph. The theme button uses clean outline SVG moon/sun icons, indicating the mode it will switch to. “What we do” and “Insights” section introductions use normal static positioning rather than sticky positioning. Focused browser checks passed at desktop and mobile widths for icon centring, both themes, accessible labels, theme persistence, Services opening/Escape handling, static section positioning and horizontal overflow; header screenshots were visually inspected.

The five homepage enquiry choices now select the matching contact-form service and bring the focused field into view. The contact hash is retained without allowing the default anchor jump to remove field focus. Existing message text is preserved. Each choice has a separate related-service link; without JavaScript the main choice is a contact anchor and service selection is manual. Business name is an optional field submitted as `business_name`. Required name, email and message fields, captcha and Web3Forms handling remain in place.

Homepage, About, business-services and shared company/footer wording reflect the new positioning. Social metadata follows the updated page metadata. `llms.txt` includes the new services and full starting-price conditions. Shared assets use the `20261016-header-layout-4` version. The site remains a local static build with the existing IIS configuration.

## Verification

Integration validation on 17 October 2026: the refresh was reconciled with main's Markdown support. The HTML check passed all 51 routes and 102 HTML files; all 52 Markdown versions were regenerated and passed the up-to-date check. All six Markdown/content-negotiation regression tests passed using a workspace temporary folder. Production IIS behaviour remains unverified.

`npm run check` verifies every existing route, extensionless copies, canonical URLs, internal links/assets/anchors, JSON-LD syntax, discovery-hub links, article dates, retained prices, project links and obsolete wording. It also checks the new service routes, homepage metadata, primary service order, enquiry options and the conditions beside each £100 offer.

`npm run check:browser` uses Playwright. It resolves the locally installed package or the package directory specified by `SITE_BROWSER_MODULE`; `PLAYWRIGHT_BROWSERS_PATH` can point to an existing matching browser cache. The check starts and stops its own local server. It blocks external requests and simulates form replies, so no enquiry is transmitted. Browser evidence is written to the ignored `.sites-runtime/refresh-checks/` directory.

Validation on 16 October 2026:

- `npm run build` generated 51 routes, including seven articles, plus matching clean-URL copies and the 404 page.
- `npm run check` passed 102 generated HTML files, 4,637 local links/assets and 102 valid structured-data blocks. Existing routes, article dates, Home Support prices, the older managed-plan anchor and phone-number removal remain verified. New service routes, primary service order, enquiry mappings, homepage SEO and the conditions beside both £100 offers passed. Every generated page is checked for obsolete estimate terminology and unsupported minimum-term wording; the exact Starter/Standard allowances and two-item homepage proof are also checked.
- `npm run check:browser` passed 250 page/layout checks. Every route was checked at 320 and 1440 pixels in light and dark themes; representative pages, including all four new services, were checked at 768 pixels. No horizontal page overflow, missing images, unlabelled fields, script errors or CTA contrast failures were detected.
- All five enquiry choices selected the expected service, retained message text, kept the contact hash and focused the service field. Business name remained optional and was included in the simulated submission. Required-field validation, invalid email, empty captcha, simulated success and simulated server failure passed.
- Desktop and mobile keyboard navigation, Enter/Tab, Escape focus return, outside-click closing, mobile-menu state, touch navigation, theme persistence and Home Support FAQs passed. JavaScript-disabled checks covered both discovery hubs, manual form selection, contact-anchor fallback and the native Services disclosure.
- Desktop homepage, desktop and mobile pricing, and the expanded mobile Services menu screenshots were visually inspected. The hosting requirement, separate domain/email costs and no-VAT wording are visible beside the build offer.
- The browser suite used the installed Playwright package and matching browser cache. The sandbox denied local Chromium navigation; the successful run used the approved local browser execution outside that restriction. All third-party requests remained blocked and form responses were simulated.

Earlier refresh validation on 4 October 2026:

- 47 routes, 94 generated HTML files and 3,682 local links/assets passed static checks. All 94 structured-data blocks parsed successfully.
- 224 browser page/layout checks covered every route at 320 and 1440 pixels in both themes, with representative pages also checked at 768 pixels. No horizontal page overflow, missing images, script errors or button contrast failures were detected.
- Keyboard focus, the skip link, mobile menu and Escape handling, theme persistence, all five business-finder choices, Home Support navigation, native FAQs and contact validation passed. Success and failure messages were checked using simulated responses.
- Both hubs remained visible and navigable with JavaScript disabled. Their ten industry and twelve location links were present in HTML.
- Screenshots of desktop, mobile, tablet and both themes were inspected.

## Live discovery-hub investigation

The crawler text extraction omitted child links on the live Industries and Locations pages. A separate Chromium check of the existing live site, with JavaScript disabled, returned HTTP 200 for both pages. The initial response HTML contained all ten industry links and twelve location links, and every link was visible in the browser DOM. The missing links in that extracted text therefore do not demonstrate a JavaScript-injection or crawlability defect. The extractor's internal reason remains unknown.

The refreshed hubs still render their destination anchors directly in HTML. No claim about Google indexing or rankings follows from these checks.

Deployment remains a separate step. This validation covers generated local output; IIS production routing and actual third-party form delivery were not exercised. Browser form replies were simulated and no enquiry was sent.
