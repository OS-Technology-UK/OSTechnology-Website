#!/usr/bin/env python3
"""Generate the markdown representation of every page on the site.

Each `foo.html` gets a sibling `foo.md` holding the same page content as clean,
formatting-stripped markdown. IIS serves those files to clients that ask for
markdown via `Accept: text/markdown` (see the content-negotiation rules in
web.config), or to anyone who requests the `.md` URL directly.

Run this after editing any page:

    pip install beautifulsoup4 html2text
    python3 tools/generate-markdown.py

Pass --check to verify the committed .md files are up to date without writing
(useful in CI); the script exits non-zero if anything is stale.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

try:
    import html2text
    from bs4 import BeautifulSoup, NavigableString
except ImportError:  # pragma: no cover - dependency hint
    sys.exit("Missing dependencies. Run: pip install beautifulsoup4 html2text")

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE_ORIGIN = "https://ostechnology.uk"

# Directories that hold tooling or config rather than published pages.
SKIP_DIRS = {".git", ".claude", "tools", "css", "images", "media"}

# Chrome that repeats on every page and carries no information for a reader who
# already has the page's own content: navigation, the footer, decorative icons,
# and eyebrow labels that only restate the heading beneath them.
STRIP_SELECTORS = [
    "script",
    "style",
    "noscript",
    "svg",
    "iframe",
    "template",
    "header.site-header",
    "footer.site-footer",
    "nav.breadcrumb",
    "nav.footer-nav",
    ".back-to-top",
    ".theme-toggle",
    ".nav-toggle",
    ".page-hero-bg",
    ".section-kicker",
    ".page-hero-kicker",
    ".article-share",
    ".blog-card-link",
    ".related-link",
    ".faq-chevron",
    ".h-captcha",
    ".form-success",
    ".form-error-msg",
    "[aria-hidden='true']",
    "[hidden]",
]


def decode_contact(value: str) -> str | None:
    """Contact details are base64-encoded in the HTML to deter address harvesters."""
    try:
        return base64.b64decode(value).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError, ValueError):
        return None


def absolutise(href: str, page_url: str) -> str:
    """Resolve a page-relative href to its canonical absolute, extensionless URL."""
    if not href or href == "#" or href.startswith(("mailto:", "tel:", "data:")):
        return href
    absolute = urljoin(page_url, href)
    parts = urlsplit(absolute)
    if parts.netloc.endswith("ostechnology.uk"):
        path = re.sub(r"/index\.html$", "/", parts.path)
        path = re.sub(r"\.html$", "", path)
        absolute = urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))
    return absolute


def page_url_for(path: Path) -> str:
    """The canonical URL of a page, derived from its path under the repo root."""
    relative = path.relative_to(REPO_ROOT).as_posix()
    if relative == "index.html":
        return f"{SITE_ORIGIN}/"
    return f"{SITE_ORIGIN}/{relative[: -len('.html')]}"


def meta_content(soup: BeautifulSoup, name: str) -> str:
    tag = soup.find("meta", attrs={"name": name})
    return " ".join(tag["content"].split()) if tag and tag.get("content") else ""


def promote_faq_questions(root) -> None:
    """FAQ accordions are buttons in the HTML; markdown wants a heading + answer."""
    for faq_list in root.select("ul.faq-list, ol.faq-list"):
        faq_list.name = "div"
    for item in root.select("li.faq-item"):
        item.name = "div"
    for question in root.select(".faq-question"):
        heading = BeautifulSoup("", "html.parser").new_tag("h3")
        heading.string = question.get_text(" ", strip=True)
        question.replace_with(heading)


def form_url(form, page_url: str) -> str:
    """Link to the form's enclosing section, or to the form itself."""
    section = form.find_parent(attrs={"id": True})
    anchor = section.get("id") if section else form.get("id")
    parts = urlsplit(page_url)
    return urlunsplit(parts._replace(fragment=anchor or ""))


def contact_form_url(root, page_url: str) -> str:
    """Use this page's contact form when present, otherwise the homepage's."""
    form = root.find("form", class_="contact-form")
    return form_url(form, page_url) if form else f"{SITE_ORIGIN}/#contact"


def rewrite_contact_links(root, page_url: str) -> None:
    """Restore the visible text of obfuscated contact links.

    Email is already published in plain text in llms.txt, so it is spelled out
    here. The phone number is not published anywhere in plain text, so it stays
    behind the contact form rather than being exposed by this conversion.
    """
    contact_url = contact_form_url(root, page_url)
    for link in root.select("[data-contact-type]"):
        kind = link.get("data-contact-type")
        value = decode_contact(link.get("data-contact-value", "")) or ""
        if kind == "mailto" and value:
            link.attrs = {"href": f"mailto:{value}"}
            link.string = value
        else:
            link.attrs = {"href": contact_url}
            link.string = "Contact form"


def replace_widgets(root) -> None:
    """Interactive widgets are step indicators and hidden states in the markup.

    Their text reads as noise once flattened, so each is summarised in a line
    that says what the widget is and where to find it.
    """
    for card in root.select(".configurator-card"):
        card.replace_with(
            BeautifulSoup(
                "<p>The homepage carries an interactive IT planner: a four-step "
                "questionnaire (home or business, priorities, level of cover, "
                f"contact details) that submits an enquiry. It is at "
                f"{SITE_ORIGIN}/#it-planner.</p>",
                "html.parser",
            )
        )


def replace_forms(root, page_url: str) -> None:
    """Form controls are useless as text; point at the form's URL instead."""
    for form in root.find_all("form"):
        placeholder = BeautifulSoup(
            f"<p>Use the contact form at {form_url(form, page_url)} to get in touch.</p>",
            "html.parser",
        )
        form.replace_with(placeholder)


def flatten_article_meta(root) -> None:
    """Blog post metadata is a row of spans; join it into one readable line."""
    for meta in root.select(".article-meta"):
        parts = [
            part.get_text(" ", strip=True)
            for part in meta.find_all("span")
            if "article-meta-dot" not in (part.get("class") or [])
        ]
        parts = [part for part in parts if part]
        if not parts:
            continue
        line = BeautifulSoup(f"<p>{' — '.join(parts)}</p>", "html.parser")
        meta.replace_with(line)


def unwrap_card_links(root) -> None:
    """Card links wrap whole blocks of content in a single <a>.

    Left alone they collapse into one enormous link label. Unwrap them and put
    the destination back at the end of the card as an ordinary link.
    """
    for link in root.find_all("a", href=True):
        if not link.find(["h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol"]):
            continue
        href = link["href"]
        heading = link.find(["h1", "h2", "h3", "h4", "h5", "h6"])
        label = heading.get_text(" ", strip=True) if heading else href
        link.name = "div"
        del link["href"]
        if href and href != "#":
            link.append(BeautifulSoup(f'<p><a href="{href}">{label}</a></p>', "html.parser"))


def flatten_headings(root) -> None:
    """A <br> inside a heading would otherwise split it across two lines."""
    for heading in root.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        for break_tag in heading.find_all("br"):
            break_tag.replace_with(NavigableString(" "))


def clean(root, page_url: str) -> None:
    for selector in STRIP_SELECTORS:
        for tag in root.select(selector):
            tag.decompose()
    flatten_headings(root)
    flatten_article_meta(root)
    promote_faq_questions(root)
    rewrite_contact_links(root, page_url)
    replace_widgets(root)
    replace_forms(root, page_url)
    for tag in root.find_all("a", href=True):
        tag["href"] = absolutise(tag["href"], page_url)
    unwrap_card_links(root)
    # Empty icon placeholders (<i data-lucide="...">) would otherwise emit stray
    # emphasis markers.
    for tag in root.find_all("i"):
        if not tag.get_text(strip=True):
            tag.decompose()


def tidy(markdown: str) -> str:
    markdown = markdown.replace("\u00a0", " ")
    markdown = re.sub(r"[ \t]+$", "", markdown, flags=re.MULTILINE)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    # Removed icons leave a space inside the link text: "[ Get in Touch]".
    markdown = re.sub(r"\[[ \t]+", "[", markdown)
    markdown = re.sub(r"[ \t]+\]", "]", markdown)
    # html2text escapes characters that need no escaping in prose.
    markdown = re.sub(r"\\([\-\.\+#'\"])", r"\1", markdown)
    return markdown.strip() + "\n"


def convert(path: Path) -> str:
    soup = BeautifulSoup(path.read_text(encoding="utf-8-sig"), "html.parser")
    page_url = page_url_for(path)

    title = soup.title.get_text(strip=True) if soup.title else path.stem
    description = meta_content(soup, "description")
    canonical = soup.find("link", rel="canonical")
    if canonical and canonical.get("href"):
        page_url = canonical["href"]

    body = soup.find("main") or soup.body or soup
    clean(body, page_url)

    writer = html2text.HTML2Text()
    writer.body_width = 0
    writer.ignore_images = True
    writer.protect_links = False
    writer.single_line_break = False
    writer.wrap_links = False
    writer.unicode_snob = True

    content = tidy(writer.handle(str(body)))

    front_matter = [
        "---",
        f"title: {json.dumps(title, ensure_ascii=False)}",
    ]
    if description:
        front_matter.append(f"description: {json.dumps(description, ensure_ascii=False)}")
    front_matter += [
        f"url: {json.dumps(page_url, ensure_ascii=False)}",
        "site: OS Technology",
        "---",
        "",
        "",
    ]
    return "\n".join(front_matter) + content


def html_pages() -> list[Path]:
    pages = [
        path
        for path in REPO_ROOT.rglob("*.html")
        if not SKIP_DIRS.intersection(path.relative_to(REPO_ROOT).parts[:-1])
    ]
    return sorted(pages)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the committed .md files match the HTML instead of writing them",
    )
    args = parser.parse_args()

    stale: list[str] = []
    for page in html_pages():
        target = page.with_suffix(".md")
        markdown = convert(page)
        relative = target.relative_to(REPO_ROOT).as_posix()
        if args.check:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != markdown:
                stale.append(relative)
            continue
        target.write_text(markdown, encoding="utf-8")
        print(f"wrote {relative}")

    if args.check:
        if stale:
            print("Stale markdown (re-run tools/generate-markdown.py):")
            for name in stale:
                print(f"  {name}")
            return 1
        print(f"{len(html_pages())} markdown files up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
