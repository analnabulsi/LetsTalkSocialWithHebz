# Let's Talk Social with Hebz — website

One-page community website (plus an event recap page and a legal page) built for **GitHub Pages**.
Plain HTML, CSS and JavaScript: no build step, no frameworks, nothing to install.

```
index.html            Home page (all sections)
event.html            Past event recap page  → event.html?id=your-event-id
legal.html            Privacy · Cookies · Terms (tabs)
offline.html          Shown when the installed app has no internet
404.html              "Page not found"
css/styles.css        All styles
js/main.js            Links, events, testimonials, gallery, install card, cookie note
js/map.js             Community world map
js/event.js           Fills event.html from data/events.json
sw.js                 Service worker (install as app + offline)
manifest.webmanifest  App name, colours and icons
data/*.json           ← ALL CONTENT YOU EDIT LIVES HERE
assets/               Photos and icons
```

---

## 0. Draft mode: the login screen ON/OFF switch
Open **`data/config.json`** and change one word:

```json
"draftMode": true,     ← login screen ON  (draft, only people with the login can see the site)
"draftMode": false,    ← login screen OFF (site open to everyone)
```
On github.com: open `data/config.json` → pencil icon → change `true`/`false` → **Commit changes**. It takes effect in about a minute. Visitors may need to refresh.

* **Login:** username `heba`, password `123456`. **Change it** (below), because `123456` is one of the most guessed passwords.
* **How long it lasts:** a successful login lasts until the browser tab is closed, or stays on that device if "Remember me" is ticked.
* **What it protects:** this is a **privacy curtain, not real security**. It keeps visitors, Google and people who get the link from seeing the draft. GitHub Pages is static, though, and on the free plan the repository is public, so a technical person could read the files on github.com. Don't put anything confidential in the site.
* **If `config.json` can't be read** (for example after a typo), the login screen shows, so the draft stays covered.

**Change the username or password.** In Terminal on your Mac:
```bash
printf 'lts-draft-v1|heba|YOUR-NEW-PASSWORD' | shasum -a 256
```
Copy the long code it prints into `HASH` at the top of `js/gate.js` (the username goes in lowercase). The password itself is never stored, only this code.

**Share link (signs in automatically):** add `#access=` and the key to your site address, for example:
```
https://YOUR-USERNAME.github.io/YOUR-REPO/#access=JRv61nLLXTaen4CIfM-bczeG
```
* Whoever opens it is signed in on that device. The key then disappears from the address bar, so it isn't copied on by accident.
* **Anyone who has the link can see the draft**, so send it privately (for example in a direct message, not a group).
* **To cancel the link,** make a new key with the Terminal commands at the top of `js/gate.js` and paste the new code into `ACCESS_HASH`. Old links stop working, and the username and password keep working.
* **To turn share links off,** set `ACCESS_HASH` to `''`.

**Need real protection for a draft?** Host the draft on Cloudflare Pages with Cloudflare Access instead. It's free for small teams, and reviewers sign in with an email code.

### Going live for real (so Google can list the site)
Setting `"draftMode": false` opens the site to visitors straight away. To also let **search engines** index it:
1. In `index.html`, `event.html` and `legal.html`, delete the line `<meta name="robots" content="noindex, nofollow">`. Keep the `gate.js` line: it does nothing while `draftMode` is `false`, and lets you switch the login back on any time.
2. Replace `robots.txt` with the 3 lines shown inside it.

---

## 1. Put it on GitHub Pages

**Easiest (no software needed):**
1. Sign in at github.com and create a new repository (for example `letstalksocial`).
2. Click **Add file → Upload files**, drag in **everything inside this folder** (including the hidden `.nojekyll` file), and commit.
3. Go to **Settings → Pages**, under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/letstalksocial/`.

**With git (Terminal):**
```bash
cd path/to/this/folder
git init && git add . && git commit -m "Launch website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/letstalksocial.git
git push -u origin main
```

### Custom domain (optional)
In **Settings → Pages → Custom domain** enter your domain and tick **Enforce HTTPS**, then add the DNS records GitHub shows you at your domain provider.
⚠️ `letstalksocialwithhebz.com` currently points to WordPress. Pointing it to GitHub replaces the WordPress site, so move anything you still need first (for example the contact page linked in `data/config.json`). You could also use a subdomain such as `www.` or `community.` instead.
If your final address is different, update it in `index.html` (`canonical` tag), `robots.txt` and `sitemap.xml`.

> `404.html` uses root paths (`/css/...`), which is correct on a custom domain. On a `github.io/repo-name/` address the 404 page shows without styling, which is harmless.

---

## 2. Edit the content (no coding)

Edit files directly on github.com: open the file → pencil icon → change → **Commit changes**. The site updates in about a minute.
Keep the quotes, commas and brackets exactly as they are. If the site stops showing something, paste the file into jsonlint.com to find the typo.

### `data/config.json` — links and numbers
```json
"links": {
  "whatsapp": "https://chat.whatsapp.com/XXXX",
  "jobs": "https://chat.whatsapp.com/YYYY",
  "survey": "https://forms.gle/XXXX",
  "testimonial": "https://forms.gle/YYYY",
  "contact": "https://letstalksocialwithhebz.com/contact/",
  "instagram": "https://www.instagram.com/XXXX",
  "linkedin": "https://www.linkedin.com/company/XXXX"
},
"stats": { "members": "4,000+", "countries": "53", "since": "2019", "events": "30+" },
"coverImage": "assets/cover.jpg"
```
* An empty link shows as "coming soon" and can't be clicked.
* Only `https://` (and `mailto:`) links are accepted.
* `events` is hidden until you fill it in.

### Photos
* **Hebz's photo:** save it as `assets/hebz.jpg` (square, about 400×400). Until then an "H" monogram is shown.
* **Cover:** add `assets/cover.jpg` (about 1600×500) and set `coverImage`.
* **Size:** use web-size images (1600px wide max, under 300 KB). squoosh.app makes this easy, and also strips location data from photos.

### `data/testimonials.json`
Only add testimonials where the member ticked the permission box in your Google Form.
```json
{ "items": [
  { "quote": "This community changed how I plan content.", "name": "Sara A.", "role": "Social Media Manager", "country": "UAE", "photo": "" }
] }
```
**Recommended Google Form questions:** quote, name, role, country, plus a required checkbox: *"I agree my name, role, country and quote may be published on the website and social media."* Add an "Approved" column in the response sheet, and copy only approved rows here.

### `data/events.json`
```json
{
  "upcoming": [
    { "title": "Reels that convert", "type": "Workshop", "date": "2026-12-12", "city": "Dubai", "image": "assets/events/reels.jpg" }
  ],
  "past": [
    {
      "id": "ramadan-content-2026",
      "title": "Ramadan content masterclass",
      "type": "Masterclass",
      "date": "2026-02-10",
      "city": "Dubai",
      "attendees": 80,
      "cover": "assets/events/ramadan-cover.jpg",
      "summary": "One-line summary used for search engines.",
      "recap": ["First paragraph.", "Second paragraph."],
      "takeaways": ["Plan early", "Post after iftar", "Test short video"],
      "speakers": [{ "name": "Speaker Name", "title": "Role, Company" }],
      "partners": "Venue / sponsor names",
      "photos": [{ "src": "assets/events/ramadan-1.jpg", "alt": "Panel on stage" }]
    }
  ]
}
```
* `id` uses lowercase letters, numbers and dashes only. The recap page is `event.html?id=ramadan-content-2026`.
* **Never put Stripe payment links here.** The website is public. Booking links belong only in the WhatsApp community.

### `data/gallery.json`
```json
{ "photos": [ { "src": "assets/gallery/meetup-1.jpg", "alt": "Members networking at the Dubai meetup" } ] }
```
The first photo is shown large. Public highlights only: full albums stay in WhatsApp. Right-click saving is blocked, but that is only a deterrent. Anything on a public website can be screenshotted, so only publish photos you're happy to be public, with consent from the people in them.

### `data/members-by-country.json` — the world map
```json
{
  "updated": "Nov 2026",
  "members": { "United Arab Emirates": 1450, "Saudi Arabia": 380, "Egypt": 310, "United States": 70 },
  "events":  { "United Arab Emirates": 30, "Saudi Arabia": 2 }
}
```
* Use country names exactly as in `data/world.json`, for example `United Kingdom`, `United States`, `Türkiye`, `DR Congo`.
* Countries with fewer than 10 members show as "Fewer than 10" to protect privacy.
* Collect **country of residence** (not nationality) in your survey, with a consent checkbox, and publish totals only.

---

## 3. Before you go live — checklist
- [ ] Fill every link in `data/config.json`.
- [ ] Set `"draftMode": false` and follow "Going live for real" in section 0.
- [ ] Replace the `[BRACKETS]` in `legal.html` (legal entity, licence number, emirate, emails, refund policy, retention period, date), and have a UAE-qualified lawyer review it.
- [ ] Add `assets/hebz.jpg` and, if you like, `assets/cover.jpg`.
- [ ] Replace the app icons in `assets/icons/` with the real logo (keep the same file names and sizes: 192, 512, maskable 512 with a safe margin, apple-touch 180).
- [ ] Add real map totals, testimonials, events and gallery photos (each section shows a tidy "coming soon" message while empty).

## 4. Updating code later
After changing any CSS or JS file, open `sw.js` and bump `VERSION` (`lts-v1` → `lts-v2`), so installed phones fetch the new files.

## 5. Preview on your computer
Opening `index.html` by double-clicking won't load the data files, because browsers block that. Run a tiny local server instead:
```bash
cd path/to/this/folder
python3 -m http.server 8000
```
Then open http://localhost:8000.

---

## Security & privacy notes
* **Strict Content Security Policy:** only this site's own scripts can run. No inline scripts or styles, and no third-party trackers.
* **Safe content handling:** all content from `data/*.json` is inserted as plain text, never as HTML. Links must be `https://`, and images must be files inside the site.
* **Safe outbound links:** they open with `rel="noopener noreferrer"`.
* **No sensitive data:** no logins, forms, passwords or payments on this site. Payments happen on Stripe's own checkout, and GitHub Pages must not be used to send passwords or card numbers.
* **Minimal storage:** the only browser storage is two "I closed this" flags (`lts-notice`, `lts-install`) and the offline cache. All are listed in the cookie policy.
* **Fonts:** Playfair Display, Mrs Saint Delafield and Plus Jakarta Sans come from Google Fonts (SIL Open Font License: free, including commercial use). To stop loading from Google entirely, download them (for example with google-webfonts-helper), put them in `assets/fonts/`, add `@font-face` rules at the top of `css/styles.css`, remove the Google Fonts `<link>` tags, change `font-src` in the CSP to `'self'`, and remove the Google Fonts line from the privacy and cookie policy.
* **Map data:** Natural Earth via world-atlas (public domain / ISC), simplified.
* **Brand logos:** WhatsApp, Instagram and LinkedIn are named in plain text. If you add their logos, use only the official files and follow their brand guidelines.
