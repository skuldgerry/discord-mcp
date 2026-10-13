# Changelog

All notable changes to the enhanced MCP-Discord fork are recorded here.
Releases follow the policy in [VERSIONING.md](VERSIONING.md).

## [Unreleased]

## [2.2.1] - 2026-10-13

### Changed

- Refresh runtime dependencies, lockfile, and Node 24 container base.
- Align release documentation with the already-published 2.2.0 image.
- Keep GitHub container CI build-only; publish approved releases from the dedicated remote builder.

## [2.2.0] - 2026-07-28

### Added

- Read-only `discord_get_channel_info` inspection with normalized permission
  names, hierarchy details, and parent overwrite synchronization status.
- Voice-channel creation with hierarchy, bitrate, user capacity, RTC region,
  video quality, and typed permission overwrites.
- Public/private thread creation and lifecycle editing, including archive,
  lock, auto-archive, slowmode, and private-thread invitation controls.
- Explicit regression coverage for locked, unlocked, and parent-only channel
  moves, replies, message pagination, voice channels, thread lifecycle,
  overwrite serialization, synchronization calculation, and transport parity.

### Changed

- `discord_edit_channel` accepts optional `lockPermissions`. Explicit values
  use Discord's native `lock_permissions` move semantics; `true` synchronizes
  with the destination category and `false` preserves independent overwrites.
- Channel edit responses report the requested and applied lock value and,
  whenever it can be verified, whether permissions match the parent.
- `discord_send` and `discord_dm_member` support native message replies with
  configurable missing-reference behavior.
- `discord_read_messages` supports mutually exclusive `before`, `after`, and
  `around` pagination cursors.
- Generic channel inspection/editing now covers type-specific text, voice, and
  default thread settings.
- Tool catalog increased from 71 to 75 tools.

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
