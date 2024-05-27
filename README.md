# npm-san-check

*This tool is considered as a practice. Please use at your own risk.*

Yet another `package.json` update checker.

*Why another?* Because I really liked [`npm-check-updates`](https://github.com/raineorshine/npm-check-updates), but its shorter command `ncu` conflicts with NVIDIA's [Nsight Compute CLI](https://developer.nvidia.com/nsight-compute), and it has 334 dependencies in total.

## Introduction

The CLI tool is a *practice* to mimic the core (i.e., a small subset of) functionalities of `npm-check-updates` with reasonably fewer dependencies. In short:

- It should only work with Node.js and npm.
- It should only work with Node.js v18 or above as vanilla `fetch` is used.
- It doesn't support workspaces.
- It can only check local dependencies (i.e., where a `package.json` is presented).
- It only has CLI interface.

The good side is:

- It has only 5 direct dependencies (or 12 dependencies in total).

For most of the time, though, `npm-check-updates` might be preferred for your use case. The name of the tool is from the fact that using this tool might lead to your sanity crisis.

## Installation

```
npm i -g npm-san-check
```

Or, run with `npx`:

```
npx npm-san-check
```

## How the update is determined

*Due to the nature of the rules, you might want to run an additional* `npm upgrade` *after* `npm install`.

### "Newer"

The tool would try to update the dependencies to *the newer versions that fit the semantic*:

- Unary ranges having "larger than" semantics (`^`, `~`, `>`, `>=`) are updated to the newest versions that satisfies them, with the *range symbol* kept.
- Wildcards (`*`, `x`, `X`) are preserved.
- Other ranges, as well as hyphen ranges (`-`) and compound ranges (`||`), are ignored.

This is the default strategy of the tool.

### "Latest"

The tool would update the dependencies to *the latest versions* with the *policies* kept.

- Unary ranges (`^`, `~`, `<`, `<=`, `>`, `>=`, `=` or omitted) are updated to the latest versions with the *range symbols* kept.
- For hyphen ranges (`-`), the right side is updated to the newest version.
- Wildcards (`*`, `x`, `X`) are preserved.
- Compound ranges (connected by `||`) are ignored.

## Usage

```
npm-sc [...filters] [-u | --update] [-l | --latest] [--pre | --prerelease]
```

**filters**: Packages to be updated.

- Support `*` for glob matching (e.g., `*eslint*` matches every packages that has `eslint` in it's name, like `@eslint/js` or `@typescript-eslint/parser`).
- Multiple package names are combined by **OR** logic.

**-u**, **--update**: Overwrite `package.json` with the updated dependencies.

- In case version control is not used or the tool is malfunctioning, a backup file (usually `package.sc.json`) is created before updating.

**-l**, **--latest**: Let the updater to use the "latest" updating strategy instead of "newer", which might include breaking changes.

**--pre**, **--prerelease**: Include prerelease versions.

- By default, prerelease versions are excluded from update targets, unless the package version itself is a prerelease version.

**-p**, **--package**: Specify the location of the package file, relative to current working directory. Default to `package.json`.

**-r**, **--registry**: Specify the URL of the registry. Default to npm registry.

## License

MIT (c) i'DLisT 2024
