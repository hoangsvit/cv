#!/usr/bin/env python3
"""Dependency-free checks for this GitHub Pages CV site."""
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class CVPage(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.references: list[tuple[str, str, str]] = []
        self.errors: list[str] = []
        self.h1_count = 0
        self.description = False
        self.canonical = False
        self.language = False
        self.pdf_links = 0
        self._json_ld = False
        self._json_text = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == "html":
            self.language = a.get("lang") == "en"
        if tag == "h1":
            self.h1_count += 1
        if "id" in a:
            identifier = a["id"]
            if identifier in self.ids:
                self.errors.append(f"Duplicate id: {identifier}")
            if identifier:
                self.ids.add(identifier)
        if tag == "meta" and a.get("name") == "description":
            self.description = bool(a.get("content"))
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href") == "https://cv.eplus.dev/"
        if tag == "script" and a.get("type") == "application/ld+json":
            self._json_ld = True
        for attr in ("href", "src"):
            if a.get(attr) is not None:
                self.references.append((tag, attr, a[attr] or ""))
        if tag == "a":
            href = a.get("href", "")
            if a.get("target") == "_blank":
                rel = (a.get("rel") or "").split()
                if "noopener" not in rel or "noreferrer" not in rel:
                    self.errors.append(f"Unsafe target=_blank: {href}")
            if href == "assets/pdf/DavidNguyen-Resume.pdf":
                self.pdf_links += 1
        if tag == "img" and "alt" not in a:
            self.errors.append(f"Image missing alt: {a.get('src', '')}")

    def handle_data(self, data: str) -> None:
        if self._json_ld:
            self._json_text += data

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json_ld:
            try:
                payload = json.loads(self._json_text)
                if payload.get("@type") != "Person":
                    self.errors.append("Unexpected JSON-LD schema")
            except json.JSONDecodeError:
                self.errors.append("Invalid JSON-LD")
            self._json_ld = False
            self._json_text = ""


def main() -> int:
    document = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = CVPage()
    parser.feed(document)
    failures = list(parser.errors)

    if not parser.language:
        failures.append("Missing English document language")
    if parser.h1_count != 1:
        failures.append(f"Expected one H1; found {parser.h1_count}")
    if not parser.description or not parser.canonical:
        failures.append("Description or canonical URL is missing")
    if parser.pdf_links != 2:
        failures.append(f"Expected two working download CTAs, found {parser.pdf_links}")

    for tag, attr, raw in parser.references:
        if not raw.strip() or raw == "#":
            failures.append(f"Empty or placeholder {tag}[{attr}]: {raw!r}")
            continue
        parts = urlsplit(raw)
        if parts.scheme in ("https", "mailto", "tel") or raw.startswith("//"):
            continue
        if parts.scheme:
            failures.append(f"Unsupported URL scheme: {raw}")
            continue
        if raw.startswith("#"):
            if raw[1:] not in parser.ids:
                failures.append(f"Fragment target does not exist: {raw}")
            continue
        if raw.startswith("/"):
            failures.append(f"Root-relative URL not checked for static hosting: {raw}")
            continue
        path = (ROOT / unquote(parts.path)).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            failures.append(f"Local asset not found: {raw}")

    if failures:
        for message in failures:
            print(f"ERROR: {message}")
        return 1
    print(f"OK: {len(parser.references)} references checked; all local assets, anchor targets and PDF links resolve.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
