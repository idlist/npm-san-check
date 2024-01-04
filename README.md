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

- Invalid ranges are ignored.
- Compounded ranges (connected by `||`) are ignored as they should be treated by users carefully.
- Ranges with hyphen (`-`) are ignored, as most of the time, using them is to avoid using the newest version
- Equals (`=` or omitted) and less than (`<`, `<=`) are ignored.
- Other unary ranges (`^`, `~`, `>`, `>=`) are updated to the newest versions that satisfies them, with the *range symbols* kept.
- Wildcards (`*`, `x`, `X`) are preserved.

### "Latest"

- Invalid ranges are ignored.
- Compounded ranges (connected by `||`) are ignored for the reason above.
- For hyphen (`-`), the right side is updated to the newest version.
- Unary ranges (`^`, `~`, `<`, `<=`, `>`, `>=`, `=` or omitted) are updated to the latest versions with the *range symbols* kept.
- Wildcards (`*`, `x`, `X`) are preserved.
