# npm-san-check

*This tool is not finished yet, though I guess no one would notice this repository.*

Yet another `package.json` update checker.

*Why another?* Because I really liked `npm-check-updates`, but its shorter command `ncu` conflicts with NVIDIA's Nsight Compute CLI (which is also `ncu`), and it has 334 dependencies in total.

## Usage

```
npm-sc [...filters] [-u | --update] [-l | --latest] [--pre | --prerelease]
```

## How the update is determined

*Due to the nature of the rules, you might want to run an additional* `npm upgrade` *after* `npm install`.

### "Newer"

- Unary ranges having "larger than" semantics (`^`, `~`, `>`, `>=`) are updated to the newest versions that satisfies them, with the *range symbol* kept.
- Wildcards (`*`, `x`, `X`) are preserved.
- Other ranges, as well as hyphen ranges (`-`) and compound ranges (`||`), are ignored.

### "Latest"

- Unary ranges (`^`, `~`, `<`, `<=`, `>`, `>=`, `=` or omitted) are updated to the latest versions with the *range symbols* kept.
- For hyphen ranges (`-`), the right side is updated to the newest version.
- Wildcards (`*`, `x`, `X`) are preserved.
- Compound ranges (connected by `||`) are ignored.
