# Releasing to npm

Releases are done by the **"Publish Package to NPM"** GitHub Actions workflow
(`.github/workflows/publish.yml`). It runs the tests, builds, and publishes
`@morf_engineering/rainfalljs`. Trigger it from the repo's **Actions** tab
("Run workflow" on `main`) or by creating a GitHub release.

## Authentication — pick one

### Option A (recommended): npm Trusted Publishing — no token, no MFA

One-time setup on npmjs.com (works from any browser, including a phone):

1. Sign in at npmjs.com and open the package page:
   `https://www.npmjs.com/package/@morf_engineering/rainfalljs`
2. Go to **Settings** → **Trusted Publisher** (publishing access).
3. Choose **GitHub Actions** and enter:
   - Organization or user: `Morf-Engineering-Inc`
   - Repository: `rainfalljs`
   - Workflow filename: `publish.yml`
   - Environment: leave blank
4. Save. Done — no secrets to manage, no token expiry, and npm generates
   provenance attestations automatically.

After that, anyone with write access can release by dispatching the workflow.

### Option B: classic token secret

Create a **Granular Access Token** on npmjs.com with publish permission for
this package, then add it as the `NPM_TOKEN` repository secret
(**Settings → Secrets and variables → Actions**). Note npm now enforces
short token lifetimes, so this needs periodic rotation — prefer Option A.

## Release checklist

1. Bump `version` in `package.json` (semver) and update `CHANGELOG.md`.
2. Merge to `main` with CI green.
3. Run the publish workflow from the Actions tab.
4. Verify: `npm view @morf_engineering/rainfalljs version`.
