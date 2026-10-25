# npm-san-check

Yet another `package.json` update checker.

*Why another?* I really liked [`npm-check-updates`](https://github.com/raineorshine/npm-check-updates), but its shorter command `ncu` conflicts with NVIDIA's [Nsight Compute CLI](https://developer.nvidia.com/nsight-compute), and it (used to) have 334 dependencies in total.

## Introduction

The CLI tool starts as a *practice* to mimic the core (i.e., a small subset of) functionalities of `npm-check-updates` with reasonably fewer dependencies. In short:

- It should only work with Node.js and npm.
- It should only work with Node.js v22 or above as vanilla `fetch` is used.
- It doesn't support workspaces.
- It can only check local dependencies (i.e., where a `package.json` is presented).
- It only has CLI interface.

The good side is:

- It has 0 installation dependencies.
- There are 5 actual dependencies with sensible choice, and the bundled script is around 100KB.

I've been using the tool myself for more than 2 years, and it kind of works. Now I've decided to give it some love by refactoring it... well, hope it doesn't break.

## Installation

```
npm i -g npm-san-check
npm-sc
```

Or, run with `npx`:

```
npx npm-san-check
```

## How the update is determined

By default, the tool would check `dependencies` and `devDependencies`, as those dependencies are mostly safe to update.

Generally, updating `peerDependencies` and `optionalDependencies` should be done manually, as they require careful treatment. One wrong dependency version in those two fields may cause the whole package unable to be installed. You can still check `optionalDependencies` with this tool.

### "Newer"

The tool will try to update the dependencies to *the newer version that fits in the semantic*:

- Unary ranges having "larger than" semantics (`^`, `~`, `>`, `>=`) are updated to the newest versions that satisfy them, with the *range symbol* kept.
- Wildcards (`*`, `x`, `X`) are preserved.
- Other ranges, as well as hyphen ranges (`-`) and compound ranges (`||`), are ignored.

This is the default strategy of the tool.

### "Latest"

The tool will update the dependencies to *the latest versions* with the *policies* kept.

- Unary ranges (`^`, `~`, `<`, `<=`, `>`, `>=`, `=` or omitted) are updated to the latest versions with the *range symbols* kept.
- For hyphen ranges (`-`), the right side is updated to the newest version.
- Wildcards (`*`, `x`, `X`) are preserved.
- Compound ranges (connected by `||`) are ignored.

This is the strategy similar (but not equal) to the one `npm-check-updates` uses.

## Usage

```
npm-sc [...filters]
       [-u | --update] [-l | --latest] [--pre | --prerelease]
       [--no-deps] [--no-dev-deps] [--opt]
       [-f | --file] [-p | --provider] [-r | --registry]
```

`filters`: Packages to be updated.

- Supports `*` for glob matching (e.g., `*eslint*` matches every packages that have `eslint` in their name, like `@eslint/js` or `@typescript-eslint/parser`).
- Keywords are combined by **OR** logic.

`-u`, `--update`: Write in `package.json` with the updated dependencies.

- In case something bad happens, a back-up file (usually `package.sc.json`) will be created before updating.

`-l`, `--latest`: Let the updater to use the "latest" updating strategy instead of "newer", which usually guarantees breaking changes.

`--pre`, `--prerelease`: Check prerelease versions.

- By default, prerelease versions are excluded from update targets, unless the package version itself is already a prerelease version.

`--no-deps`: Ignore `dependencies`.

`--no-dev-deps`: Ignore `devDependencies`.

`--opt`: Check `optionalDependencies`.

`-f`, `--file`: The location of the package file, relative to current working directory. Default to `package.json`.

`-p`, `--provider`: From where the tool get the versions of the packages. Can be set to `npm` (from npm) or `jsd` (from jsDelivr).

`-r`, `--registry`: The URL of the registry. Default to the npm registry.

Note that the tool recognizes the terminal proxies (`HTTP_PROXY` and `HTTPS_PROXY`) by setting `NODE_USE_ENV_PROXY` to `1`.

## License

[PolyForm Internal Use](https://polyformproject.org/licenses/internal-use/1.0.0) (c) i'DLisT 2024 - 2026

- I mean, nobody really uses this utility except myself, so it doesn't really matter, does it?
