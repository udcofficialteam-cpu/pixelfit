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

- Uses `@bg0/browser` version 0.1.2 via the ESM CDN and its browser-side BiRefNet-lite model. Project code is Apache-2.0; model assets have separate notices/licensing in the upstream repository.
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
