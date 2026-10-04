# OS Technology

Static site for [ostechnology.uk](https://ostechnology.uk), served by IIS. Routing,
MIME types, caching and security headers all live in `web.config`.

## Markdown for agents

Every generated page has a markdown twin in `dist` (`dist/about.html` → `dist/about.md`) holding the
same content as clean, formatting-stripped text. AI agents and other clients can
reach it two ways:

- send `Accept: text/markdown` to the normal page URL — `web.config` rewrites the
  request to the `.md` file and responds `text/markdown; charset=utf-8`
- request the `.md` URL directly, e.g. `https://ostechnology.uk/about.md`

Browsers send `Accept: text/html,...`, never match the negotiation rules, and keep
getting HTML. Because one URL now has two representations, page responses carry
`Vary: Accept`.

The markdown is generated, not hand-written. After editing the site, rebuild and regenerate it:

```sh
npm run build
pip install beautifulsoup4 html2text
python3 tools/generate-markdown.py
```

`python3 tools/generate-markdown.py --check` verifies the committed `.md` files
match the HTML without writing anything, and exits non-zero if any are stale.

Run the generator and content-negotiation regression checks with the same dependencies:

```sh
python3 -m unittest discover -s tools -p 'test_*.py'
```
