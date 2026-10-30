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

## Placeholders to replace

Search the project for `[` to find every placeholder. Anything in square brackets is yours to fill in.

### Text (find and replace across all files)
| Placeholder | Where | Notes |
|---|---|---|
| `[EMAIL]` | `contact.html`, `index.html` schema | |
| `[DOMAIN]` | Every page `<head>`, `robots.txt`, `sitemap.xml` | e.g. `chwispy.com`, no `https://` |
| `[X] hours` / `[X] days` | `services.html` event package | Coverage hours, turnaround |
| `[Month]` | `contact.html` availability line | Or delete the line |
| FAQ answers + fine print | `services.html` | Marked `[Placeholder]` / `[Edit…]` |
| Gear list | `about.html` | `[Camera body A]` etc. |
| Photo caption | `about.html` | `On set, [location], [year]` |

### Projects (`work.html` + the featured three on `index.html`)
The first three projects are real (vest fitting, boot unboxing, Indian walkaround). Their media is already in place; what's left to confirm on each:
- `data-client` (currently `[Client name]`), your role (`[confirm your role]`), and the `[Draft]` breakdown: add the goal and a real result.
- `data-type` if I guessed wrong: the boot unboxing is filed as Commercial, the other two as Social content.

The remaining six cards on `work.html` are placeholders. Each project is one `<article class="card">` block. For each one, set:
- `data-title`, `data-client`, `data-industry`, `data-role`, `data-duration` (timecode)
- `data-breakdown`: 2–3 sentences, goal then result
- `data-embed`: the Vimeo player URL (`https://player.vimeo.com/video/123456789`) or YouTube embed URL (`https://www.youtube.com/embed/VIDEO_ID`). Captions come from Vimeo/YouTube; the lightbox shows a "Show captions" toggle for embeds.
- `data-video` (optional): a short compressed MP4 that plays in the lightbox until `data-embed` is set. Fine for clips under ~30s; use Vimeo/YouTube for anything longer.
- `data-preview`: a 3–6 second silent clip for hover/tap previews
- `data-orientation="vertical"` (plus the `card--vertical` class) for 9:16 work
- `data-type`: one of `commercial`, `brand-film`, `social`, `events`, `music` (this drives the filter)
- the visible text inside the card, and the image `alt` text

### Media files
Done: the hero reel (`assets/video/reel*.mp4/.webm`, cut from your three clips; phones get the vertical `reel-portrait` version), its posters, and the three real projects' posters (`assets/img/<project>.jpg`), previews (`assets/video/previews/`) and full videos (`assets/video/full/`).

Still to add for the placeholder projects and About page:
| File | Spec |
|---|---|
| `assets/img/project-02.jpg` … `project-08.jpg` | Stills, 1080×1350 (4:5) or larger, under 150 KB each |
| `assets/video/previews/project-02.mp4` … | 3–6s, 720p, no audio, under 1 MB each |
| `assets/img/chris-on-set.jpg` | Candid on-set photo, 1200×1500 (4:5) |
| `assets/logos/client-1.svg` … `client-6.svg` | Light-colored SVG or transparent PNG. The CSS greys them out. |

The placeholders are `.svg` files. When you add a real `.jpg`, update the `src` path in the HTML from `.svg` to `.jpg`.

### Social proof
- 6 client logos and 3 testimonials on `index.html`, plus another 3 on `services.html`. All are marked `[Testimonial placeholder]`, `[Name, Title]`, `[Company]`. Use real quotes only.

### Inquiry form (Jotform)
- The form lives in your Jotform account: [edit it here](https://www.jotform.com/build/263021312658046). Change questions, budget tiers, colors and the thank-you message there; the site updates automatically.
- In the Jotform builder, go to **Settings → Emails** and make sure the notification goes to your inbox.
- Budget tiers were set to sample ranges (Under $1,000 up to $10,000+). Adjust them to match your pricing.

### Booking
- "Book a call" buttons across the site go to the Contact page, where a "Book a free consultation" button opens the Jotform in a new tab. If you later add Calendly or Cal.com, swap that button's link for your scheduling URL.

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
- Set up a free [Google Business Profile](https://www.google.com/business/) with the Inland Empire as your service area. It's the biggest local SEO lever you have.
- Run Lighthouse in Chrome DevTools on the live site. With compressed media at the sizes above, it should score 90+.

## How things work

- **Colors and fonts:** edit the `:root` tokens at the top of `css/style.css`.
- **Reduced motion:** when a visitor's device asks for less motion, the reel doesn't autoplay (the poster shows), the grain and blinking REC dots turn off, hover previews are skipped, and fades are near-instant.
- **Accessibility:** skip link, visible focus rings, keyboard-operable menu, filters and lightbox (Esc closes it and focus returns to the card); a pause button on the hero reel.
- **Adding a nav link:** the header and footer are repeated in each HTML file. Update all five pages. Keep it to four links plus Book a call.
