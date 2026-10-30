# Chris "Chwispy" portfolio

A hand-coded portfolio site: plain HTML, CSS and vanilla JS. No build step, no framework, no page builder. Open any `.html` file in a text editor to change it.

```
index.html      Home: showreel hero, statement, featured work, services teaser, proof, CTA
work.html       Filterable portfolio grid + video lightbox
services.html   Packages with "Starting at" pricing, process, testimonials, FAQ
about.html      Behind the Lens: story, what I bring, process, gear, on-set photo
contact.html    Jotform inquiry form embed + Calendly/Cal.com embed
css/style.css   All styles; colors and fonts live in the :root tokens at the top
js/main.js      Header, mobile menu, reveals, reel, previews, filters, lightbox, booking embed
assets/         Images, logos, video, favicon, share image
tools/og-image.html  Template for regenerating the social share image
```

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

## Placeholders to replace

Search the project for `[` to find every placeholder. Anything in square brackets is yours to fill in.

### Text (find and replace across all files)
| Placeholder | Where | Notes |
|---|---|---|
| `[EMAIL]` | `contact.html`, `index.html` schema | |
| `[CITY]` | Every page (titles, descriptions, footer), `index.html` schema | Your home base, for local SEO |
| `[DOMAIN]` | Every page `<head>`, `robots.txt`, `sitemap.xml` | e.g. `chwispy.com`, no `https://` |
| `$[X]` | `services.html` (4 prices), `index.html` services teaser | Starting prices |
| `[X] hours` / `[X] days` | `services.html` event package | Coverage hours, turnaround |
| `[Month]` | `contact.html` availability line | Or delete the line |
| FAQ answers + fine print | `services.html` | Marked `[Placeholder]` / `[Edit…]` |
| Gear list | `about.html` | `[Camera body A]` etc. |
| Photo caption | `about.html` | `On set, [location], [year]` |

### Projects (`work.html` + the 4 featured on `index.html`)
Each project is one `<article class="card">` block. For each one, set:
- `data-title`, `data-client`, `data-industry`, `data-role`, `data-duration` (timecode)
- `data-breakdown`: 2–3 sentences, goal then result. Every one is currently marked `[Draft]`. Replace with real numbers.
- `data-embed`: the Vimeo player URL (`https://player.vimeo.com/video/123456789`) or YouTube embed URL (`https://www.youtube.com/embed/VIDEO_ID`). Turn on captions in Vimeo/YouTube; the lightbox has a "Show captions" toggle.
- `data-preview`: a 3–6 second silent clip for hover/tap previews
- `data-type`: one of `commercial`, `brand-film`, `social`, `events`, `music` (this drives the filter)
- the visible text inside the card, and the image `alt` text

### Media files
| File | Spec |
|---|---|
| `assets/video/reel.webm` + `reel.mp4` | 10–20s silent loop, 1080p, each under ~4 MB (see compression below) |
| `assets/img/reel-poster.jpg` | First frame of the reel, 1920×1080, under 200 KB |
| `assets/img/project-01.jpg` … `project-09.jpg` | Stills, 1600×900, under 150 KB each |
| `assets/video/previews/project-01.mp4` … | 3–6s, 720p, no audio, under 1 MB each |
| `assets/img/chris-on-set.jpg` | Candid on-set photo, 1200×1500 (4:5) |
| `assets/logos/client-1.svg` … `client-6.svg` | Light-colored SVG or transparent PNG. The CSS greys them out. |
| `assets/img/og-image.jpg` | 1200×630 share image (regenerate with your name from `tools/og-image.html`) |

The placeholders are `.svg` files. When you add a real `.jpg`, update the `src`/`poster` path in the HTML from `.svg` to `.jpg`.

### Social proof
- 6 client logos and 3 testimonials on `index.html`, plus another 3 on `services.html`. All are marked `[Testimonial placeholder]`, `[Name, Title]`, `[Company]`. Use real quotes only.

### Inquiry form (Jotform)
- The form lives in your Jotform account: [edit it here](https://www.jotform.com/build/263021312658046). Change questions, budget tiers, colors and the thank-you message there; the site updates automatically.
- In the Jotform builder, go to **Settings → Emails** and make sure the notification goes to your inbox.
- Budget tiers were set to sample ranges (Under $1,000 up to $10,000+). Adjust them to match your pricing.

### Booking
- `contact.html`: set `data-booking-url="REPLACE_BOOKING_URL"` to your Calendly or Cal.com link (dark-theme examples are in the comment above it). It loads only when scrolled into view.

## Compressing video

Using [ffmpeg](https://ffmpeg.org):

```bash
# Hero reel (MP4 + WebM), no audio
ffmpeg -i reel-master.mov -an -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart assets/video/reel.mp4
ffmpeg -i reel-master.mov -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 assets/video/reel.webm
# Poster frame
ffmpeg -i assets/video/reel.mp4 -frames:v 1 -q:v 3 assets/img/reel-poster.jpg
# Card preview clip (5s from 0:12)
ffmpeg -ss 12 -t 5 -i project.mov -an -vf "scale=1280:-2" -c:v libx264 -crf 28 -movflags +faststart assets/video/previews/project-01.mp4
```

Full-length videos stay on Vimeo or YouTube. Only the reel and short previews are hosted on the site.

## Deploying

The inquiry form is hosted by Jotform, so it works on any host.

### Netlify (recommended)
1. Push this repo to GitHub (already done).
2. At [app.netlify.com](https://app.netlify.com), choose **Add new site → Import an existing project**, then pick this repo. Leave the build command empty; the publish directory is `.` (already set in `netlify.toml`).
3. Deploy.
4. **Custom domain:** **Domain management → Add a domain**, then either point your registrar's nameservers to Netlify (easiest), or add the `A`/`CNAME` records Netlify shows you. HTTPS is issued automatically.

### Vercel
1. At [vercel.com/new](https://vercel.com/new), import the repo. Framework preset: **Other**, no build command.
2. **Custom domain:** **Project → Settings → Domains → Add**, then add the DNS records it shows at your registrar.

### After launch
- Replace every `[DOMAIN]` so canonical URLs, the sitemap and share previews are correct.
- Submit `https://yourdomain.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).
- Set up a free [Google Business Profile](https://www.google.com/business/) for [CITY]. It's the biggest local SEO lever you have.
- Run Lighthouse in Chrome DevTools on the live site. With compressed media at the sizes above, it should score 90+.

## How things work

- **Colors and fonts:** edit the `:root` tokens at the top of `css/style.css`.
- **Reduced motion:** when a visitor's device asks for less motion, the reel doesn't autoplay (the poster shows), the grain and blinking REC dots turn off, hover previews are skipped, and fades are near-instant.
- **Accessibility:** skip link, visible focus rings, keyboard-operable menu, filters and lightbox (Esc closes it and focus returns to the card); a pause button on the hero reel.
- **Adding a nav link:** the header and footer are repeated in each HTML file. Update all five pages. Keep it to four links plus Book a call.
