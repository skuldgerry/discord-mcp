# Versioning Policy

MCP-Discord uses Semantic Versioning in the form `MAJOR.MINOR.PATCH`.

The enhanced fork has one release version shared by:

- `package.json` and `package-lock.json`;
- the version reported by the MCP server;
- the Git tag `vMAJOR.MINOR.PATCH`;
- the immutable Docker tag `MAJOR.MINOR.PATCH`;
- the matching entry in `CHANGELOG.md`.

## Choosing the next version

### MAJOR

Increment `MAJOR` for incompatible changes that require a client or operator to
act, including:

- removing or renaming a tool;
- removing or renaming an input or output field;
- making an optional input required;
- changing defaults or behavior in a way that can break existing automation;
- incompatible transport, authentication, configuration, or runtime changes.

Where practical, deprecate a public tool or field for at least one minor release
before removing it in the next major release.

### MINOR

Increment `MINOR` for backward-compatible capabilities, including:

- adding tools;
- adding optional inputs or structured output fields;
- supporting new Discord features or message components;
- adding a transport or configuration option without changing existing
  behavior.

Versions 2.1.0 and 2.2.0 are minor releases because they add tools
and optional capabilities while preserving existing tool names and valid
inputs.

### PATCH

Increment `PATCH` for backward-compatible corrections, including:

- bug and security fixes that preserve the public contract;
- reliability, validation, performance, packaging, or documentation fixes;
- dependency updates that do not change supported behavior.

If a fix necessarily breaks the public contract, classify it as a major release
regardless of its size.

## Pre-releases

Use SemVer pre-release identifiers for testing, for example:

- `2.2.0-rc.1`
- `3.0.0-beta.1`

Pre-release images must use the exact pre-release tag and must not update
`latest`.

## Release process

During development, `package.json`, `package-lock.json`, and the local MCP
server may carry the selected next version before a release exists. The README
must identify that version as unreleased and continue to name the last
published immutable Docker tag. The Git tag, dated changelog entry, and Docker
tag are created together only during the authorized release.

1. Review changes since the last `vMAJOR.MINOR.PATCH` tag and select the version
   using the rules above.
2. Update `package.json` and `package-lock.json`.
3. Move completed entries from `Unreleased` into a dated changelog section.
4. Update README examples to the new immutable Docker tag.
5. Run:

   ```bash
   npm test
   npm run audit:dispatch
   ```

6. Confirm the working tree contains only the intended release changes.
7. Commit the release and create the annotated Git tag
   `vMAJOR.MINOR.PATCH`.
8. Push the commit and tag only after explicit approval.
9. Build the exact release commit on the dedicated remote builder. Verify tests,
   the MCP health endpoint, protocol initialization, tool catalog, and image scan.
10. Publish the immutable image tag first, then `latest`, and verify both digests.
    GitHub container CI only builds; it never publishes images or Docker Hub text.

## Docker tags

Approved stable releases publish from the dedicated remote builder:

- `MAJOR.MINOR.PATCH` — immutable deployment tag;
- `latest` — latest validated stable release.

Never replace or rebuild an existing immutable `MAJOR.MINOR.PATCH` tag. Publish a
new patch release instead.
