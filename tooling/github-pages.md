# GitHub Pages

SAL remains a client-only SvelteKit static application. Only `build/` is uploaded.
The workflow runs only through `workflow_dispatch`; pushes do not deploy.

## Hosting settings

Edit `githubAccount` and `hostingUrl` in `config/github-pages.ts` before publishing.
The supplied placeholder URL is `https://YOUR_GITHUB_ACCOUNT.github.io/sal/`.
Its pathname supplies the build base automatically. For a root site or configured custom domain,
use that site's HTTPS root URL instead. The URL must match GitHub Pages configuration.
The workflow rejects the placeholder account, an owner mismatch or a URL mismatch.
These constants are public configuration, not credentials.

`bun run build:pages` generates the site locally with the placeholder path permitted.
`bun run test:browser:pages` checks that build on port 2000 in Chrome, Edge and Firefox.
Stop an existing SAL server before running these tasks. Ordinary `bun run build` and
`bun run dev` retain the root path. The build runner passes `SAL_GITHUB_PAGES=true` to
SvelteKit's workers because the pinned framework reloads configuration without the Vite mode.
The narrow Biome environment-access exclusion covers this central configuration boundary.

The only application route is `/`, prerendered to `index.html`; UI tabs do not introduce routes.
There is no server or rewrite requirement. Unknown URLs retain the host's 404 response.
Any future route must be prerendered with a compatible file layout or reviewed separately.

Sources checked 31 October 2026:
- [SvelteKit static hosting](https://svelte.dev/docs/kit/adapter-static#GitHub-Pages)
- [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Manual workflow controls](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [Bun setup action](https://github.com/oven-sh/setup-bun)
