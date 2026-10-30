# David Nguyen — Online CV

A static, responsive resume website built with exported Webflow HTML/CSS/JavaScript and hosted at **https://cv.eplus.dev/** using GitHub Pages.

![Current CV preview](https://github.com/user-attachments/assets/5bb103f6-3639-4cf3-acd5-069024ef6263)

## Local development

No framework or dependency installation is required. Use a static HTTP server rather than opening the HTML with `file://`.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Run the lightweight static integrity checks before creating a PR:

```bash
python3 scripts/check_site.py
```

The GitHub Actions workflow runs the same checks on PRs and pushes to `main`.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | English CV content and SEO metadata |
| `css/david-nguyen-cv.webflow.*.min.css` | Original generated Webflow styles |
| `css/improvements.css` | Responsive/accessible enhancements, navigation and print styles |
| `js/` | Exported Webflow scripts; do not remove without browser regression testing |
| `images/` | Profile photo and visual assets |
| `assets/pdf/DavidNguyen-Resume.pdf` | PDF linked by both Download CV buttons |
| `CNAME` | Custom domain for GitHub Pages |
| `scripts/check_site.py` | Local link, asset, semantic HTML and security checks |

## Updating the CV

1. Edit content in `index.html`. Keep employment dates, project ownership, skills and certifications accurate.
2. Update the PDF in `assets/pdf/DavidNguyen-Resume.pdf` when the online resume changes, or point both download CTAs at the new version.
3. Add or change styles in `css/improvements.css` instead of modifying generated minified Webflow CSS.
4. Check desktop and mobile layouts, all interactive links, the PDF download, and print preview.
5. Run `python3 scripts/check_site.py` and open a PR for review before merging.

## Notes and known limitations

- This repository currently has **only an English HTML page**. The prior `/vi` language switch pointed to a 404 and is hidden until a real Vietnamese page can be maintained.
- The full number behind the previously masked phone display has been removed from HTML. Contact by email remains available.
- Project URLs were previously `href="#"` placeholders. Most now point to the originally displayed external URLs; external services can change or disappear. The unverified UK Live Entertainment URL is displayed as non-clickable text.
- Some work history and certification content is older. Verify current facts with the CV owner before adding new positions or changing dates.
- This is a Webflow export; the bundled jQuery/Webflow runtime has not been removed without a full browser-interaction regression test.
- Any photos, fonts and third-party icons must remain subject to their respective licensing/attribution requirements.

## Deployment

The site is published from GitHub Pages with the `CNAME` set to `cv.eplus.dev`. Confirm the Pages source branch and HTTPS setting in repository settings before altering the deployment workflow.
