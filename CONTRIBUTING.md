# Contributing

Thanks for your interest in improving `parse-connection-url`!

## Development setup

```sh
git clone https://github.com/jdziat/parse-connection-url.git
cd parse-connection-url
npm install        # also installs the husky commit-msg hook
```

Requires Node.js ≥ 20 for development (the library itself supports ≥ 18, but vitest 4 needs 20+).

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm test` | run the test suite (vitest) |
| `npm run test:watch` | tests in watch mode |
| `npm run test:coverage` | tests with V8 coverage |
| `npm run lint` / `lint:fix` | ESLint over `src/` and `test/` |
| `npm run typecheck` | validate `index.d.ts` and JS via `tsc --noEmit` |
| `npm run docs:dev` | local docs site with hot reload |
| `npm run docs:build` | build the docs site (also checks for dead links) |

## Commit messages — Conventional Commits (enforced)

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org). A husky `commit-msg` hook runs commitlint locally, and CI re-checks every PR commit.

```
feat(parser): support comma-separated host lists
fix(serialize): encode credentials in toUrl()
docs: clarify toJSON masking behavior
test: add round-trip cases for IPv6 hosts
chore(deps): update dev dependencies
ci: tighten release workflow permissions
```

Why it matters: **releases are fully automated** by semantic-release based on the commits that land on `master`:

| Commit type | Release |
| --- | --- |
| `fix:` | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE:` footer | major |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:` | none |

There is no manual version bumping or tagging — never edit `version` in `package.json` or `CHANGELOG.md` by hand.

## Pull requests

1. Branch from `master`
2. Make your change **with tests** — bug fixes should include a regression test that fails without the fix
3. Keep `npm test`, `npm run lint`, and `npm run typecheck` green
4. Update docs (`docs/`) and the readme if behavior or API changed
5. Open a PR against `master` — CI runs the matrix (Linux/macOS/Windows × Node 20/22/24), lint, typecheck, commitlint, and a security audit

Maintainers merge with a **merge commit** so individual conventional commits drive the changelog.

## Code style

- Plain CommonJS, `'use strict'`, no runtime dependencies — keep it that way
- ESLint (flat config) is the source of truth: `npm run lint:fix`
- LF line endings everywhere (enforced via `.gitattributes`)
- Match the existing JSDoc style on public methods; keep `index.d.ts` in sync with API changes

## Docs site

The docs live in `docs/` (VitePress) and deploy to [GitHub Pages](https://jdziat.github.io/parse-connection-url/) automatically on every push to `master` via `.github/workflows/docs.yml`.

## Releases (maintainers)

Merging to `master` triggers `.github/workflows/release.yml`: semantic-release computes the version from commits, publishes to npm via OIDC trusted publishing (with provenance), creates the GitHub release, and commits the changelog back. No tokens, no manual steps.

## Security issues

Please do **not** open public issues for vulnerabilities — see [SECURITY.md](SECURITY.md).
