"""Regression checks for markdown generation and IIS Accept matching.

Run with: python -m unittest discover -s tools -p 'test_*.py'
Uses the same beautifulsoup4/html2text dependencies as the generator.
"""

import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup


TOOLS = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("generate_markdown", TOOLS / "generate-markdown.py")
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class MarkdownGenerationTests(unittest.TestCase):
    def test_faq_conversion_accepts_a_main_tag(self):
        soup = BeautifulSoup(
            '<main><ul class="faq-list"><li class="faq-item">'
            '<button class="faq-question">Can you help?</button>'
            '<div class="faq-answer"><p>Yes, we can.</p></div>'
            '</li></ul></main>', "html.parser"
        )
        generator.clean(soup.main, "https://ostechnology.uk/example")
        self.assertEqual(soup.main.h3.get_text(), "Can you help?")
        self.assertIn("Yes, we can.", soup.main.get_text())
        self.assertIsNone(soup.main.find("button"))

    def test_metadata_round_trips_special_characters(self):
        title = 'Copilot: GPT and "Claude" \\ tools'
        description = 'For business: quotes "and" backslashes \\ work.'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                f'<html><head><title>{title}</title>'
                f"<meta name='description' content='{description}'></head>"
                '<body><main><h1>Hello</h1></main></body></html>', encoding="utf-8"
            )
            with patch.object(generator, "REPO_ROOT", root):
                markdown = generator.convert(page)
        metadata = dict(line.split(": ", 1) for line in markdown.split("---", 2)[1].strip().splitlines())
        self.assertEqual(json.loads(metadata["title"]), title)
        self.assertEqual(json.loads(metadata["description"]), description)
        self.assertEqual(json.loads(metadata["url"]), "https://ostechnology.uk/")

    def test_contact_links_use_real_form_sections_or_homepage(self):
        for page, section, expected in (
            ("about", None, "https://ostechnology.uk/#contact"),
            ("partners", None, "https://ostechnology.uk/#contact"),
            ("free-cybersecurity-audit", "audit", "https://ostechnology.uk/free-cybersecurity-audit#audit"),
            ("", "contact", "https://ostechnology.uk/#contact"),
        ):
            with self.subTest(page=page):
                form = (f'<section id="{section}"><form class="contact-form" id="contact-form"></form></section>' if section else "")
                soup = BeautifulSoup(f'<main>{form}<a data-contact-type="tel">Call us</a></main>', "html.parser")
                generator.clean(soup.main, f"https://ostechnology.uk/{page}")
                self.assertEqual(soup.main.a["href"], expected)
                if section:
                    self.assertIn(f"Use the contact form at {expected}", soup.main.get_text())
                self.assertIsNone(soup.main.find("form"))

    def test_form_without_enclosing_anchor_uses_its_own_id(self):
        soup = BeautifulSoup('<main><form id="enquiry"></form></main>', "html.parser")
        generator.replace_forms(soup.main, "https://ostechnology.uk/example")
        self.assertIn("https://ostechnology.uk/example#enquiry", soup.main.get_text())


class AcceptNegotiationTests(unittest.TestCase):
    def test_both_rules_match_only_acceptable_markdown_media_ranges(self):
        config = ET.parse(TOOLS.parent / "web.config")
        rules = [rule for rule in config.findall(".//rewrite/rules/rule") if rule.get("name").startswith("Markdown negotiation")]
        self.assertEqual(len(rules), 2)
        cases = {
            "text/markdown": True,
            "application/x-markdown": True,
            "Text/Markdown; charset=utf-8; Q=1": True,
            "text/html, text/markdown;q=0.5": True,
            "text/markdown;q=0.001": True,
            "text/markdown;q=1.000": True,
            "text/html;q=0, text/markdown": True,
            "text/markdown;q=0, application/markdown;q=0.8": True,
            "text/html, text/markdown;q=0": False,
            "text/markdown;q=0.": False,
            "text/markdown;q=0.0": False,
            "text/markdown;q=0.00": False,
            "text/markdown;q=0.000": False,
            "text/markdown; charset=utf-8; q=0; version=1": False,
            "text/markdown;q=0, text/html": False,
            "text/markdown;q=0, application/x-markdown;q=0.000": False,
            "text/html,application/xhtml+xml,*/*;q=0.8": False,
            "text/markdown-extra": False,
            "text/plain; note=text/markdown": False,
            "": False,
        }
        for rule in rules:
            condition = next(item for item in rule.findall("conditions/add") if item.get("input") == "{HTTP_ACCEPT}")
            pattern = re.compile(condition.get("pattern"), re.IGNORECASE)
            for accept, expected in cases.items():
                with self.subTest(rule=rule.get("name"), accept=accept):
                    self.assertEqual(bool(pattern.search(accept)), expected)


if __name__ == "__main__":
    unittest.main()
