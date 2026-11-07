# Running locally and deploying

## See the site on your computer (localhost)

1. Get the latest code: GitHub Desktop → **Fetch origin** → **Pull**, or download the repo ZIP from GitHub.
2. Double-click the launcher in the repo folder:
   - **Windows:** `run-local-windows.bat`
   - **Mac:** `run-local-mac.command` (first time: right-click → **Open** → **Open**, because macOS blocks unsigned scripts)
3. Your browser opens **http://localhost:8000**. Edit files, then refresh the browser to see changes.
4. To stop, close the black terminal window.

The launcher uses Python if installed, otherwise Node (`npx serve`). If neither is installed it opens `index.html` directly, which also works for the current static page.

Port 8000 busy? Edit `PORT=8000` in the launcher to another number, e.g. 8080.

Manual alternative from a terminal in the repo folder: `python -m http.server 8000` (Mac: `python3`) or `npx serve -l 8000 .`

## Deploying (manual only)

Pushing to GitHub does **not** deploy. `vercel.json` turns off Git auto-deploys, so the live site (https://heatpump-hackathon.vercel.app) only changes when someone deploys on purpose.

### From the Vercel dashboard (no terminal)

1. Make sure the code you want is pushed to `main` on GitHub.
2. Open https://vercel.com/cmu-tant-ninja-turtles/heatpump-hackathon/deployments
3. Click **Create Deployment** (top right; on some layouts it's under the **⋯** menu).
4. Choose branch **main** (or paste a commit link/SHA) → **Create Deployment**.
5. Wait for **Ready**, then open https://heatpump-hackathon.vercel.app to check.

Deploying a branch other than `main` creates a preview (needs a Vercel login to view). Only `main` goes to the live link.

### Undo a bad deploy

Deployments page → find the last good **Production** deployment → **⋯** → **Promote** (or **Instant Rollback**). The live link switches back in seconds.

### From the terminal (optional)

With the Vercel CLI logged in and the folder linked (`vercel link`, choose team *CMUtant Ninja Turtles*, project *heatpump-hackathon*):

```
vercel --prod
```

This uploads your local folder as-is, including uncommitted changes, so commit first.

### Turning auto-deploy back on

Delete `vercel.json` (or set `"deploymentEnabled": true`) and push to `main`.
