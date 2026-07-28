# Changelog

All notable changes to the enhanced MCP-Discord fork are recorded here.
Releases follow the policy in [VERSIONING.md](VERSIONING.md).

## [Unreleased]

### Added

### Changed

### Fixed

## [2.1.0] - 2026-07-28

### Added

- Channel creation with parent/category placement, position, and typed
  permission overwrites.
- Generic channel editing and movement between categories.
- Post-creation replacement of channel and category permission overwrites.
- Privacy-safe category cutover that hides the old category before repositioning
  and revealing the new category.
- Components V2 and Media Gallery support in `discord_dm_member`.
- Automated coverage for hierarchy, permissions, cutover ordering, DMs, and
  existing `discord_send` behavior.

### Changed

- `discord_dm_member` now supports allowed mention controls and suppressed
  notifications and returns `channelId`, `messageId`, and `url`.
- Relevant creation and message operations return structured identifiers for
  manifests and future edits.
- Dispatch parity validation now audits standard MCP, stdio, and Streamable HTTP
  surfaces individually.
- Tool catalog increased from 68 to 71 tools.

## [2.0.0]

- Established the enhanced fork's 2.x release line with typed Discord
  Components V2, expanded Discord administration tools, and Docker distribution.
