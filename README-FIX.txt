PIXELFIT BACKGROUND REMOVER FIX

The existing version was pointing at the 0.1.2 package through one ESM CDN. This update uses the published 0.1.1 package and tries a second public ESM CDN if the first cannot be reached.

How to deploy the one-file fix:
1. Extract this ZIP.
2. Open your pixelfit GitHub repository.
3. Add file > Upload files.
4. Upload ONLY app.js to the repository root, replacing the old app.js.
5. Commit changes.
6. Wait for the Vercel deployment to finish.
7. Open https://pixelfit-kohl.vercel.app/ and hard refresh with Ctrl+F5.
8. Try the same JPG again. First use still needs internet to download the model (about 94 MiB).

This integration is still browser-only; no image upload backend or API key is added.
