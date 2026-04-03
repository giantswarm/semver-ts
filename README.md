# semver-ts

A TypeScript library that mimics [semantic versioning](https://semver.org/) comparison and constraints parsing behavior of the [Masterminds/semver](https://github.com/Masterminds/semver) Go library.

Written with the goal to emulate upgrade detection for [Flux CD OCIRepository](https://fluxcd.io/flux/components/source/ocirepositories/) resources in a TypeScript/NodeJS context (a Backstage portal).

Zero runtime dependencies. Tested against 344 cases derived from the Masterminds/semver Go test suite.

## Installation

```sh
npm install @giantswarm/semver-ts
```

## Usage

### Parsing versions

`Version.parse()` accepts loose input (optional `v` prefix, incomplete versions). `Version.parseStrict()` requires exact `X.Y.Z` format per the semver spec.

```typescript
import { Version } from "@giantswarm/semver-ts";

const v = Version.parse("v1.2.3-beta.1+build.42");
console.log(v.major);      // 1
console.log(v.minor);      // 2
console.log(v.patch);      // 3
console.log(v.prerelease); // "beta.1"
console.log(v.metadata);   // "build.42"
console.log(v.toString()); // "1.2.3-beta.1+build.42"

// Loose parsing accepts incomplete versions
Version.parse("v2.1");   // 2.1.0
Version.parse("3");      // 3.0.0

// Strict parsing rejects incomplete or prefixed versions
Version.parseStrict("1.2.3"); // OK
Version.parseStrict("v1.2");  // throws
```

### Comparing versions

```typescript
import { Version, sort } from "@giantswarm/semver-ts";

const a = Version.parse("1.2.3");
const b = Version.parse("1.3.0");

a.compare(b); // -1 (a < b)
a.lt(b);      // true
a.gt(b);      // false
a.eq(b);      // false

// Prerelease versions are less than their release counterpart
const rc = Version.parse("2.0.0-rc.1");
const release = Version.parse("2.0.0");
rc.lt(release); // true

// Metadata is ignored in comparisons
Version.parse("1.0.0+aaa").eq(Version.parse("1.0.0+zzz")); // true

// Sort an array of versions (returns a new array, ascending)
const sorted = sort([
  Version.parse("3.0.0"),
  Version.parse("1.0.0"),
  Version.parse("2.0.0-alpha"),
  Version.parse("2.0.0"),
]);
// ["1.0.0", "2.0.0-alpha", "2.0.0", "3.0.0"]
```

### Checking constraints

`Constraints.parse()` supports all Masterminds/semver constraint syntax: comparison operators, wildcards, tilde and caret ranges, hyphen ranges, AND (comma or space), and OR (`||`).

```typescript
import { Version, Constraints } from "@giantswarm/semver-ts";

const c = Constraints.parse("^1.2.0");
c.check(Version.parse("1.8.3")); // true
c.check(Version.parse("2.0.0")); // false
```

#### Operators

| Syntax | Example | Meaning |
|--------|---------|---------|
| `=` | `=1.2.3` | Exact match (default when no operator) |
| `!=` | `!=1.2.3` | Not equal |
| `>` `>=` `<` `<=` | `>=1.2.0` | Comparison |
| `~` | `~1.2.3` | Patch-level changes allowed (`>=1.2.3, <1.3.0`) |
| `^` | `^1.2.3` | Minor-level changes allowed (`>=1.2.3, <2.0.0`) |
| `*` `x` `X` | `1.2.x` | Wildcard (`>=1.2.0, <1.3.0`) |
| `-` | `1.2 - 2.0` | Hyphen range (`>=1.2.0, <=2.0.0`) |

Constraints can be combined with AND (comma or space) and OR (`||`):

```typescript
// AND: all must match
Constraints.parse(">=1.2, <2.0").check(Version.parse("1.5.0")); // true

// OR: any group must match
Constraints.parse("^1.0 || ^2.0").check(Version.parse("2.3.0")); // true

// Complex
Constraints.parse(">=1.1, <2, !=1.2.3 || >= 3").check(Version.parse("3.0.0")); // true
```

#### Prerelease handling

By default, constraints exclude prerelease versions unless the constraint itself contains a prerelease tag. Pass `{ includePrerelease: true }` to `check()` or `validate()` to override this.

```typescript
const c = Constraints.parse(">=1.0.0");
c.check(Version.parse("1.5.0-beta"));                              // false (prerelease excluded)
c.check(Version.parse("1.5.0-beta"), { includePrerelease: true }); // true

// Constraints with prerelease tags always match prerelease versions
Constraints.parse(">=1.0.0-0").check(Version.parse("1.5.0-beta")); // true
```

## Compatibility

| @giantswarm/semver-ts version | github.com/Masterminds/semver |
|-|-|
| v0.1.0 | v3.4.0 |

## License

Apache 2.0 — see [LICENSE](LICENSE).

This library's behavior is based on [Masterminds/semver](https://github.com/Masterminds/semver) (MIT license) by Matt Butcher and Matt Farina.
