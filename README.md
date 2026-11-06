# KY Furniture website

Static website for **KY Furniture**, sofa and furniture manufacturer in Ahmedabad.
Plain HTML, CSS and JavaScript. No build step.

## Run locally

```bash
python -m http.server 5520
```

Then open http://localhost:5520

## Deploy on Vercel

1. Import this repository in Vercel.
2. Framework preset: **Other**. Leave build command and output directory empty.
3. Deploy. `vercel.json` already sets clean URLs, caching and security headers.

## Folders

| Folder | What is in it |
| --- | --- |
| `index.html` | The whole page |
| `css/style.css`, `js/main.js` | Styles and interactions |
| `assets/` | Logo, category, product, service, people and partner images |
| `gallery/thumbs`, `gallery/large` | Gallery photos (small for the carousel, large for the viewer) |
| `videos/` | Hero video and the four showcase videos |
