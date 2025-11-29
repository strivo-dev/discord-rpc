/**
 * Discord Rich Presence RPC Library
 * 
 * @module dc-rpc
 * 
 * @description
 * A comprehensive TypeScript library for implementing Discord Rich Presence
 * and RPC functionality in your applications. This library provides:
 * 
 * - Full Rich Presence support with activities, party info, and custom images
 * - Voice settings management and control
 * - Guild and channel information retrieval
 * - Event subscription and real-time updates
 * - Lobby creation and management
 * - Social features (invites, join requests)
 * 
 * @example Basic Usage
 * ```typescript
 * import { RpcClient, ActivityType } from 'dc-rpc';
 * 
 * const client = new RpcClient();
 * 
 * await client.login({
 *   clientId: 'YOUR_CLIENT_ID',
 *   scopes: ['rpc']
 * });
 * 
 * await client.setActivity({
 *   type: ActivityType.Playing,
 *   details: 'Exploring the world',
 *   state: 'Level 50',
 *   startTimestamp: Date.now()
 * });
 * ```
 * 
 * @example With Events
 * ```typescript
 * client.on('ready', () => {
 *   console.log('Connected to Discord!');
 * });
 * 
 * const subscription = await client.subscribe('VOICE_STATE_UPDATE');
 * client.on('VOICE_STATE_UPDATE', (data) => {
 *   console.log('Voice state changed:', data);
 * });
 * ```
 * 
 * @see {@link https://discord.com/developers/docs/topics/rpc}
 */

// ============================================================================
// Core Client Exports
// ============================================================================

/**
 * Re-exports all client functionality.
 * 
 * @remarks
 * Includes the main RpcClient class and related types for interacting
 * with Discord's RPC services.
 * 
 * Exported members:
 * - {@link RpcClient} - Main RPC client class
 * - {@link ActivityType} - Enum for activity types
 * - {@link ActivityArgs} - Type for activity configuration
 * - {@link RpcErrorType} - Type for RPC errors
 * - {@link VoiceSettings} - Type for voice configuration
 * 
 * @example
 * ```typescript
 * import { RpcClient, ActivityType, VoiceSettings } from 'dc-rpc';
 * 
 * const client = new RpcClient();
 * const activity: ActivityArgs = {
 *   type: ActivityType.Playing,
 *   state: 'In Menu'
 * };
 * ```
 */
export * from './functions/client';

// ============================================================================
// Transport Layer Exports
// ============================================================================

/**
 * Re-exports IPC transport implementation.
 * 
 * @remarks
 * The IPC transport handles low-level communication with Discord's local
 * client through named pipes (Windows) or Unix sockets (macOS/Linux).
 * 
 * Most users won't need to interact with this directly, as the RpcClient
 * handles transport internally. However, it's exported for advanced use cases.
 * 
 * Exported members:
 * - {@link IPCTransport} - Main IPC transport class
 * - {@link encode} - Function to encode IPC messages
 * - {@link decode} - Function to decode IPC messages
 * 
 * @example Advanced Usage
 * ```typescript
 * import { IPCTransport } from 'dc-rpc';
 * 
 * const transport = new IPCTransport({
 *   clientId: 'YOUR_CLIENT_ID'
 * });
 * 
 * await transport.connect();
 * 
 * transport.on('message', (message) => {
 *   console.log('Raw message:', message);
 * });
 * ```
 */
export * from './transports/ipc';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Registers a protocol handler with the operating system.
 * 
 * @remarks
 * This function registers a custom protocol (e.g., `discord-123456789012345678://`)
 * that allows Discord to launch your application through deep links.
 * 
 * This is useful for implementing features like:
 * - Join game from Discord
 * - Spectate from Discord
 * - OAuth2 redirect URIs
 * 
 * **Platform Support:**
 * - Windows: Registers in Windows Registry
 * - macOS: Registers in Info.plist
 * - Linux: Registers with xdg-utils
 * 
 * @param id - The application identifier (typically your client ID)
 * @returns The registered protocol string (e.g., `discord-123456789012345678`)
 * 
 * @example
 * ```typescript
 * import { register } from 'dc-rpc';
 * 
 * // Register protocol handler
 * const protocol = register('123456789012345678');
 * console.log('Registered:', protocol);
 * // Output: "discord-123456789012345678"
 * 
 * // Now Discord can launch your app with URLs like:
 * // discord-123456789012345678://join?secret=abc123
 * ```
 * 
 * @example Handling Protocol Launch
 * ```typescript
 * // In your application entry point
 * import { register } from 'dc-rpc';
 * 
 * const protocol = register(process.env.DISCORD_CLIENT_ID);
 * 
 * // Parse command line arguments for protocol URL
 * const protocolUrl = process.argv.find(arg => 
 *   arg.startsWith(protocol + '://')
 * );
 * 
 * if (protocolUrl) {
 *   const url = new URL(protocolUrl);
 *   const action = url.pathname; // 'join', 'spectate', etc.
 *   const secret = url.searchParams.get('secret');
 *   
 *   // Handle the deep link
 *   handleDeepLink(action, secret);
 * }
 * ```
 * 
 * @see {@link https://discord.com/developers/docs/rich-presence/how-to#joining}
 */
export function register(id: string): string;

// ============================================================================
// Package Metadata
// ============================================================================

/**
 * The current version of the dc-rpc library.
 * 
 * @remarks
 * This value is automatically populated from package.json during the build process.
 * Use this to check compatibility or display version information in your application.
 * 
 * @example
 * ```typescript
 * import { version } from 'dc-rpc';
 * 
 * console.log(`Using dc-rpc v${version}`);
 * // Output: "Using dc-rpc v1.2.3"
 * ```
 * 
 * @example Version Checking
 * ```typescript
 * import { version } from 'dc-rpc';
 * 
 * const [major, minor, patch] = version.split('.').map(Number);
 * 
 * if (major < 2) {
 *   console.warn('Using older version of dc-rpc');
 * }
 * ```
 */
export const version: string;

// ============================================================================
// Quick Start Guide
// ============================================================================

/**
 * @example Complete Example
 * ```typescript
 * import { RpcClient, ActivityType, register } from 'dc-rpc';
 * 
 * // Configuration
 * const CLIENT_ID = 'YOUR_CLIENT_ID';
 * 
 * // Register protocol for deep linking
 * register(CLIENT_ID);
 * 
 * // Initialize client
 * const client = new RpcClient();
 * 
 * // Event handlers
 * client.on('ready', () => {
 *   console.log('Logged in as', client.user.username);
 * });
 * 
 * client.on('error', (error) => {
 *   console.error('RPC Error:', error);
 * });
 * 
 * // Connect and login
 * async function main() {
 *   try {
 *     await client.login({
 *       clientId: CLIENT_ID,
 *       scopes: ['rpc', 'activities.read']
 *     });
 * 
 *     // Set rich presence
 *     await client.setActivity({
 *       type: ActivityType.Playing,
 *       details: 'Competitive Match',
 *       state: 'Ranked #42',
 *       startTimestamp: Date.now(),
 *       largeImageKey: 'game_logo',
 *       largeImageText: 'My Awesome Game',
 *       smallImageKey: 'rank_icon',
 *       smallImageText: 'Diamond Rank',
 *       partySize: 2,
 *       partyMax: 5,
 *       buttons: [
 *         { label: 'Join Game', url: 'https://example.com/join' },
 *         { label: 'View Stats', url: 'https://example.com/stats' }
 *       ]
 *     });
 * 
 *     // Subscribe to voice state changes
 *     const subscription = await client.subscribe('VOICE_STATE_UPDATE');
 *     client.on('VOICE_STATE_UPDATE', (state) => {
 *       console.log('Voice state:', state);
 *     });
 * 
 *     // Get user's guilds
 *     const guilds = await client.getGuilds();
 *     console.log(`User is in ${guilds.length} servers`);
 * 
 *   } catch (error) {
 *     console.error('Failed to initialize:', error);
 *   }
 * }
 * 
 * // Cleanup on exit
 * process.on('beforeExit', async () => {
 *   await client.clearActivity();
 *   await client.destroy();
 * });
 * 
 * main();
 * ```
 */

/**
 * @example Game Integration
 * ```typescript
 * import { RpcClient, ActivityType } from 'dc-rpc';
 * 
 * class GameIntegration {
 *   private client: RpcClient;
 *   private gameStartTime: number;
 * 
 *   constructor(clientId: string) {
 *     this.client = new RpcClient();
 *     this.gameStartTime = Date.now();
 *   }
 * 
 *   async connect() {
 *     await this.client.login({
 *       clientId: 'YOUR_CLIENT_ID',
 *       scopes: ['rpc']
 *     });
 *   }
 * 
 *   async updateGameState(state: {
 *     mode: string;
 *     map: string;
 *     score: number;
 *     maxScore: number;
 *   }) {
 *     await this.client.setActivity({
 *       type: ActivityType.Playing,
 *       details: `${state.mode} on ${state.map}`,
 *       state: `Score: ${state.score}/${state.maxScore}`,
 *       startTimestamp: this.gameStartTime,
 *       largeImageKey: state.map.toLowerCase(),
 *       largeImageText: state.map,
 *       smallImageKey: 'game_icon',
 *       smallImageText: 'Playing'
 *     });
 *   }
 * 
 *   async onGameEnd() {
 *     await this.client.clearActivity();
 *   }
 * 
 *   async disconnect() {
 *     await this.client.destroy();
 *   }
 * }
 * 
 * // Usage
 * const game = new GameIntegration('YOUR_CLIENT_ID');
 * await game.connect();
 * 
 * // Update during gameplay
 * await game.updateGameState({
 *   mode: 'Capture the Flag',
 *   map: 'Desert Arena',
 *   score: 2,
 *   maxScore: 3
 * });
 * 
 * // Cleanup
 * await game.onGameEnd();
 * await game.disconnect();
 * ```
 */

/**
 * @example Music Player Integration
 * ```typescript
 * import { RpcClient, ActivityType } from 'dc-rpc';
 * 
 * interface Track {
 *   title: string;
 *   artist: string;
 *   album: string;
 *   duration: number;
 *   albumArt?: string;
 * }
 * 
 * class MusicPresence {
 *   private client: RpcClient;
 * 
 *   constructor() {
 *     this.client = new RpcClient();
 *   }
 * 
 *   async connect(clientId: string) {
 *     await this.client.login({ clientId, scopes: ['rpc'] });
 *   }
 * 
 *   async updateNowPlaying(track: Track) {
 *     const startTime = Date.now();
 *     const endTime = startTime + (track.duration * 1000);
 * 
 *     await this.client.setActivity({
 *       type: ActivityType.Listening,
 *       details: track.title,
 *       state: `by ${track.artist}`,
 *       startTimestamp: startTime,
 *       endTimestamp: endTime,
 *       largeImageUrl: track.albumArt,
 *       largeImageText: track.album,
 *       smallImageKey: 'play_icon',
 *       smallImageText: 'Playing'
 *     });
 *   }
 * 
 *   async pause() {
 *     await this.client.clearActivity();
 *   }
 * }
 * 
 * // Usage
 * const presence = new MusicPresence();
 * await presence.connect('YOUR_CLIENT_ID');
 * 
 * await presence.updateNowPlaying({
 *   title: 'Awesome Song',
 *   artist: 'Great Artist',
 *   album: 'Best Album',
 *   duration: 240,
 *   albumArt: 'https://example.com/album.jpg'
 * });
 * ```
 */