# Lua Boon Yi: Portfolio

Static website (no build step). Open `index.html` through a web server, or publish as below.

## Structure
- `index.html`: page content
- `css/style.css`: all styling
- `js/main.js`: tabs, image viewer, photo tilt, looping showreel
- `assets/images/`: photos and the link-preview image (`og-image.jpg`)
- `assets/video/Showcase_Reel.mp4`: looping showreel
- `assets/docs/Lua_Boon_Yi.pdf`: resume PDF

## Publish on GitHub Pages
1. Create a new repository and upload everything in this folder (keep `index.html` at the top level).
2. Repository Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Wait a minute, then open the address GitHub shows.

## Notes
- The YouTube video only plays on a real web address, not when `index.html` is opened from a folder.
- To change the resume, replace the PDF in `assets/docs/` and keep the same file name.
