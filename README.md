# David Nguyen — CV & portfolio

Production: **https://cv.eplus.dev/**

A fast, framework-free HTML/CSS portfolio served by GitHub Pages, preserving existing professional experience, certifications and the downloadable resume.

## Development

```bash
python3 -m http.server 8000
# Open http://localhost:8000/
```

No npm build, jQuery, Webflow runtime or framework required.

### Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Content, navigation, SEO and semantic page sections |
| `css/redesign.css` | Responsive portfolio styles, mobile and print layouts |
| `js/redesign.js` | Tiny mobile menu close handler; navigation remains usable without JS |
| `images/` | Existing portrait, favicon and section icons |
| `assets/pdf/DavidNguyen-Resume.pdf` | The two Download CV CTAs |
| `scripts/check_site.py` | HTML links, anchors, assets and metadata integrity test |
| `scripts/browser_smoke.mjs` | Headless Chrome test (desktop/mobile click, layout and screenshot) |
| `.github/workflows/validate-site.yml` | PR validation and downloadable visual screenshots |

Historical minified Webflow assets remain in `css/` and `js/` for reference, but the site no longer loads them.

### Content rules

- Keep **real** company names, employment dates, education and certificate credentials. The design mockup is illustrative and **not** a source of personal facts.
- Work history displays a concise company header with expandable original project details.
- Keep the online resume and the downloadable PDF synchronized after factual changes.
- The phone number was masked in the older UI, so the new contact area uses email and GitHub rather than publishing a complete number.
- The `/vi` link was removed because a Vietnamese page does not yet exist. Only add it after implementing real translated content.

## Verify before merging

```bash
python3 scripts/check_site.py
# For full browser coverage, use the GitHub Actions workflow on the PR.
```

Review the `cv-desktop-mobile-preview` artifact attached to the successful GitHub Actions run for desktop and mobile screenshots. CI also tests six navigation links, mobile menu behavior, experience disclosures, link targets and horizontal overflow.

Double-check on physical phones and browsers (especially iOS Safari), PDF contents, certificate links and actual professional history before merging.

## Deploy

The repository uses GitHub Pages and its `CNAME` is set to `cv.eplus.dev`. PR preview screenshots do not modify production. Merge to the configured Pages source only after visual review.
