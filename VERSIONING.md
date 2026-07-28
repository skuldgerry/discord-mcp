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

Version 2.1.0 is a minor release because it adds tools and optional capabilities
while preserving existing tool names and valid inputs.

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
9. Verify the immutable Docker image, MCP health endpoint, and advertised tool
   count before allowing the workflow to update floating tags.

## Docker tags

Stable Git tags publish:

- `MAJOR.MINOR.PATCH` — immutable deployment tag;
- `MAJOR.MINOR` — latest compatible patch in that minor line;
- `MAJOR` — latest compatible minor in that major line;
- `latest` — latest validated stable release.

Never replace or rebuild an existing immutable `MAJOR.MINOR.PATCH` tag. Publish a
new patch release instead.
