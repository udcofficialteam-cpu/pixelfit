# PixelFit — Free Image Toolkit

PixelFit is a static, browser-based image utility for resizing, cropping, compressing, and converting common image formats. It includes social-media size presets, desktop/mobile wallpaper dimensions, and a form-photo file-size helper.

## Features

- Responsive layout for desktop, tablet, and mobile
- Upload by file picker or drag and drop
- Resize to custom dimensions with a lockable aspect ratio
- Presets for Instagram, YouTube, Facebook, TikTok, WhatsApp, LinkedIn, Pinterest, X, and common wallpaper resolutions
- Fit, fill-and-crop, and stretch modes
- Convert to JPG/JPEG, PNG, or WebP
- Browser-based background remover with transparent PNG output and optional white, blue, or custom solid background
- JPG/WebP quality setting
- Optional file-size target; can optionally reduce dimensions to help meet it
- Preview, output dimensions, file size, file-size difference, and download
- Image is processed locally in the browser; no image API or upload endpoint is used
- Bilingual FAQ section with English / Roman Urdu toggle
- Contact dialog with a copy-email action and an optional mailto link
- No PixelFit image-upload endpoint, API key, database, build step, or custom backend
- Background-removal engine is loaded on demand from a public ESM CDN; the lightweight model is downloaded on first use (about 94 MiB on supported desktop/Android paths) and may be cached by the browser

## Files

- `index.html` — site structure and content
- `styles.css` — responsive design
- `app.js` — client-side image processing and controls
- `favicon.svg` — browser tab icon

## Run locally

Open `index.html` in a current browser, or serve the folder with any simple static server. No install/build command is required.

## Publish with GitHub + Vercel

1. Download and extract the PixelFit ZIP.
2. Create a new repository on GitHub.
3. Upload the files **inside** the extracted `pixelfit-website` folder directly into the repository root. The repository root should contain `index.html`, `styles.css`, `app.js`, `favicon.svg`, and `README.md` together.
4. Open Vercel and import that GitHub repository.
5. In Vercel, choose **Other** as the Framework Preset. Leave the Build Command blank. Use the repository root as the Root Directory. With no `public` folder, the root files can be served directly as static assets; the default output directory for Other is the project root (`.`). If Vercel shows a non-empty build command from an old project setting, clear the override.
6. Click Deploy. Vercel will provide a live URL. Later pushes to the connected GitHub branch will trigger new deployments.

No `package.json`, serverless function, API key, or database is needed.

## Background remover notes

- Uses `@bg0/browser` version 0.1.1 through public ESM CDNs with a fallback, plus its browser-side BiRefNet-lite model. Project code is Apache-2.0; model assets have separate notices/licensing in the upstream repository.
- The first removal needs internet access for the code/runtime and model downloads. No image bytes are sent to PixelFit; inference and PNG export run in the browser.
- The model download may be large and background removal can be slow or fail on low-memory devices. This static CDN integration has not been verified on every browser, particularly iOS/Safari. Test it in Chrome/Edge desktop and Android first.

## Supported formats and limitations

- Output formats: JPG/JPEG, PNG, and WebP (the browser must support WebP export).
- Source files: JPG/JPEG, PNG, WebP, GIF, and BMP when the browser can decode them. Animated GIF input is exported as a still image.
- HEIC/HEIF, TIFF, and animated output are not included in this initial static version.
- File-size targets are best-effort. If the target cannot be met at the chosen dimensions, PixelFit reports that. Enabling “Reduce dimensions if needed” permits it to reduce output dimensions.
- Social-platform presets are common reference dimensions, not official guarantees. Platforms may change recommendations and crop uploaded content differently.
- Very large images can use substantial device memory; input is limited to 30 MB and output to 40 megapixels to reduce the risk of browser crashes.

## Contact

Support email: [udc.officialteam@gmail.com](mailto:udc.officialteam@gmail.com). The Contact button opens a small support dialog so visitors can copy the address even if their device has no default email app configured. The static site does not send messages directly; an email app or webmail service is still needed to send an email.

## Privacy

PixelFit does not upload the selected image. Image decoding, drawing, compression, and export run in the user's browser. The website's HTML/CSS/JavaScript still loads from whichever static hosting provider serves the site.


## Navigation and information pages update

The top navigation focuses on the main visitor actions: Home, All Tools, FAQ, and Contact. The Image Resizer and Background Remover are available from the homepage and All Tools section, so the header stays uncluttered. About, Privacy Policy, and Terms remain in the footer. On legal pages, Home, All Tools and FAQ link back to the homepage; Contact opens the visitor's email app. On narrow screens the navigation is horizontally scrollable. About, Privacy Policy and Terms are separate static HTML pages. `robots.txt` and `sitemap.xml` are also included.

To update the connected Vercel deployment, upload all files from this package to the root of the existing GitHub repository, replacing files with matching names, then commit the changes. No build command, backend, database or API key is required.

Review the Privacy Policy before enabling ads; update it to match the actual ad/analytics services and consent requirements you configure.

## AdSense preparation note

The Privacy Policy includes a disclosure for potential Google AdSense advertising cookies and links to Google Ads Settings and aboutads.info choices. Before serving ads, configure AdSense settings and any consent message or certified CMP required for your audience and applicable policies. This policy is a starting point; keep it accurate for the services actually enabled.


## Visual redesign package

The current release includes a PixelFit blue-and-white SaaS visual refresh based on the supplied design references. The redesign updates the homepage hero, adds a custom vector illustration and benefit strip, frames the existing editor as the main workspace, and applies a consistent style to the background remover, tool cards, FAQ, contact dialog, and information pages.

### Source files in this package

- `index.html` — deployed homepage, with the original tool controls and IDs retained.
- `PixelFit-index-updated.html` — synchronized compatibility copy of the homepage; `index.html` remains the Vercel entry page.
- `styles.css` — original component and responsive styles, retained as the base layer.
- `pixel-fit-redesign.css` — new visual theme and responsive overrides.
- `app.js` — original image-processing, export, background-removal, FAQ, and contact behavior; left unchanged in this redesign.
- `about.html`, `privacy.html`, `terms.html` — information pages updated to load the redesign theme.
- `favicon.svg` — updated blue PixelFit tile mark.
- `REDESIGN-CHANGELOG.md` — modified/new/preserved file inventory and validation notes.
- `robots.txt`, `sitemap.xml`, and Google site-verification file — retained.

### Deploy the redesign to the existing Vercel project

1. Download and extract the ZIP.
2. Upload the contents of the `pixelfit-main` folder to the root of the existing GitHub repository, replacing files with matching names and adding `pixel-fit-redesign.css`.
3. Commit the changes to the connected branch.
4. Vercel should deploy the static site automatically. Keep the project configured with the repository root as the output directory (`.`), no build command, and the `Other` framework preset.
5. After deployment, hard-refresh the website (`Ctrl + F5`) so the browser loads the new stylesheet and favicon.

No package manager, build step, server, database, image API, or new dependency is introduced by the redesign.

### Functionality preservation notes

The existing `app.js` is unchanged. The upload/drop interaction, dimension locking, social and wallpaper presets, crop/fit modes, JPG/PNG/WebP export, quality setting, optional file-size target, downscaling option, background color, result preview/download, AI background-removal integration, bilingual FAQ toggle, and contact dialog remain wired to their original element IDs. The new hero links are ordinary in-page anchors to the real editor and tool catalogue; the added hero artwork is decorative and does not pretend to be an interactive editor preview.
