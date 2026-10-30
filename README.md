# Chris "Chwispy" portfolio

A hand-coded portfolio site: plain HTML, CSS and vanilla JS. No build step, no framework, no page builder. Open any `.html` file in a text editor to change it.

```
index.html      Home: showreel hero, statement, featured work, services teaser, proof, CTA
work.html       Filterable portfolio grid + video lightbox
services.html   Packages with "Book a free consultation" pricing, process, testimonials, FAQ
about.html      Behind the Lens: story, what I bring, process, gear, on-set photo
contact.html    Jotform inquiry form embed + "Book a free consultation" link to the same form
css/style.css   All styles; colors and fonts live in the :root tokens at the top
js/main.js      Header, mobile menu, reveals, reel, previews, filters, lightbox
assets/         Images, logos, video, favicon, share image
tools/og-image.html  Template for regenerating the social share image
```

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

## Placeholders and hidden sections

Visible placeholders left:
- **Project results:** each real project's `data-breakdown` (on `index.html` and `work.html`) ends with a bracketed note asking for a result, such as views, saves or sales.

Hidden until you're ready (search each file for `HIDDEN`, then delete the comment markers):
| What | Where | To bring it back |
|---|---|---|
| Client logos + testimonials | `index.html`, `services.html` | Delete the `HIDDEN until real clients are ready` line and its `END HIDDEN -->` line, then add real logos (`assets/logos/`) and quotes |
| On-set photo | `about.html` | Add `assets/img/chris-on-set.jpg` (1200×1500), delete the `ON-SET PHOTO` line and its `END HIDDEN -->` line, and remove `story--solo` from the div above |

Contact: there's no email on the site. "Send me a message" and the inquiry form both go to your Jotform: [edit it here](https://www.jotform.com/build/263021312658046).

### Adding a project
Copy one of the `<article class="card card--vertical">` blocks in `work.html` (and in `index.html` to feature it). For each one, set:
- `data-title`, `data-client`, `data-industry`, `data-role`, `data-duration` (timecode)
- `data-breakdown`: 2–3 sentences, goal then result
- `data-video`: a compressed MP4 in `assets/video/full/` that plays in the lightbox. Optionally, set `data-embed` to a Vimeo or YouTube player URL instead; that also turns on the captions toggle.
- `data-preview`: a 3–6 second silent clip in `assets/video/previews/` for hover/tap previews
- `data-poster` and the `<img>`: a cover frame in `assets/img/`
- `data-orientation="vertical"` (plus the `card--vertical` class) for 9:16 work
- `data-type`: one of `commercial`, `brand-film`, `social`, `events`, `music`. Only Commercial and Social content have filter buttons right now; add a `.filter` button in `work.html` when you add another type.

## Compressing video

Using [ffmpeg](https://ffmpeg.org):

```bash
# Hero reel (MP4 + WebM), no audio. For vertical footage, see how reel.mp4 was
# built in the git history: a blurred backdrop with the 9:16 frame on top.
ffmpeg -i reel-master.mov -an -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart assets/video/reel.mp4
ffmpeg -i reel-master.mov -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 assets/video/reel.webm
# Poster frame
ffmpeg -i assets/video/reel.mp4 -frames:v 1 -q:v 3 assets/img/reel-poster.jpg
# Card preview clip (5s from 0:12)
ffmpeg -ss 12 -t 5 -i project.mov -an -vf "scale=1280:-2" -c:v libx264 -crf 28 -movflags +faststart assets/video/previews/project-01.mp4
```

Full-length videos stay on Vimeo or YouTube. Only the reel and short previews are hosted on the site.

## Deploying

The site is live from GitHub Pages at **https://chwispystudio.com** (domain registered at IONOS).

### GitHub Pages setup (already done once; here for reference)
1. Repo **Settings → Pages**: Source "Deploy from a branch", branch `claude/chwispy-portfolio-site-ydxsf0`, folder `/ (root)`.
2. Custom domain: `chwispystudio.com` (also stored in the `CNAME` file).
3. IONOS DNS (Domains & SSL → chwispystudio.com → DNS): remove the default A/AAAA records for `@`, add A records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a CNAME for `www` pointing to `staychwispyig.github.io`. Leave MX (email) records alone.
4. Once DNS has taken effect, tick **Enforce HTTPS** in Settings → Pages.

Every push to the branch goes live within a couple of minutes. GitHub Pages ignores `netlify.toml`; it's only there if you ever move to Netlify.

### Alternative: Netlify
Import the repo at [app.netlify.com](https://app.netlify.com) with no build command (publish directory `.` is set in `netlify.toml`), then add the domain under **Domain management** and follow the DNS records it shows.

### After launch
- The domain is chwispystudio.com, set in each page's `<head>`, `robots.txt`, `sitemap.xml` and the `CNAME` file (which GitHub Pages uses; keep it in the repo).
- Submit `https://yourdomain.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).
- Set up a free [Google Business Profile](https://www.google.com/business/) with the Inland Empire as your service area. It's the biggest local SEO lever you have.
- Run Lighthouse in Chrome DevTools on the live site. With compressed media at the sizes above, it should score 90+.

## How things work

- **Colors and fonts:** edit the `:root` tokens at the top of `css/style.css`.
- **Reduced motion:** when a visitor's device asks for less motion, the reel doesn't autoplay (the poster shows), the grain and blinking REC dots turn off, hover previews are skipped, and fades are near-instant.
- **Accessibility:** skip link, visible focus rings, keyboard-operable menu, filters and lightbox (Esc closes it and focus returns to the card); a pause button on the hero reel.
- **Adding a nav link:** the header and footer are repeated in each HTML file. Update all five pages. Keep it to four links plus Book a call.
