# Changelog

All notable changes from Discord-RPC will be documented in this file.

## [1.6.0] - 2025-11-28

### Bug Fixed
- IPC transport implementation and update client functionality

### Added
- ActivityArgs type with largeImageUrl and smallImageUrl properties

### Improvement
- Update dependencies in pnpm-lock.yaml

### Removed
- Obsolete typings file (index.test-d.ts).

## [1.5.9] - 2025-01-26

### Bug Fixes

- Missing register-scheme dependencies
- Typo error code Fail Load Protocol
- ErrorCode is not defined

### Typings

- Add documentation activity type

### Removed

- websocket

## [1.5.8] - 2024-12-13

### Bug Fixes

- Wrong timeout error code #5
- Typo on error code #4

### Typings

- Add documentation activity type

### New

- Activity Type

## [1.5.7] - 2024-12-06

### New

- added npm publish via actions
- added documentation

### Bug Fixes

- Fixing ipc transport
- Fix missing library
- remove conflict dependency
- fixing some known issues

### Revamp

- revamping error class code
- Revamping all discord-rpc code

### Revert

- node-fetch to v2

### Typings

- added documentation