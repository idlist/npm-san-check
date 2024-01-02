# npm-san-check

*This tool is not finished yet, though I guess no one would notice this repository.*

Yet another `package.json` update checker.

*Why another?* Because I really liked `npm-check-updates`, but its shorter command `ncu` conflicts with Nvidia's Nsight Compute CLI, and it has 334 dependencies.

## Usage

```
npm-sc [-u | --update] [-l | --latest]
```

## How the update is determined

### "Newer"

- Invalid ranges are ignored.
- Compounded ranges (connected by `||`) are ignored as they should be treated by users carefully.
- Equals (`=` or omitted) are not touched.
- Other single ranges (`^`, `~`, `<`, `<=`, `>`, `>=`) are updated to the newest versions that satisfies them.
- Wildcards (`*`, `x`, `X`) are preserved as is.
- For hyphen (`-`), the left side is updated to the newest version.
  - If the newest version is newer than the right side, then this range becomes an equal to the right side.

Due to the nature of the rules, you might want to run an additional `npm upgrade` after `npm install`.

### "Latest"

- Invalid ranges are ignored.
- Compounded ranges (connected by `||`) are ignored for the reason above.
- Single ranges (`^`, `~`, `<`, `<=`, `>`, `>=`, `=` or omitted) are updated to the latest versions with the *range symbols* retained.
- Wildcards (`*`, `x`, `X`) are preserved, though other parts might be updated to match the latest versions.
- Hyphens (`-`) are replaced by `<=` latest version.
