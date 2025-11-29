import { EventEmitter } from "events";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Represents an error encountered during RPC operations.
 * 
 * @remarks
 * This error type follows the JSON-RPC 2.0 specification for error objects.
 * Common error codes include:
 * - `1000`: Authentication failed
 * - `4000`: Invalid request parameters
 * - `5000`: Server error
 * 
 * @example
 * ```typescript
 * try {
 *   await client.request('SOME_COMMAND');
 * } catch (error) {
 *   const rpcError = error as RpcErrorType;
 *   console.error(`Error ${rpcError.code}: ${rpcError.message}`);
 * }
 * ```
 */
export type RpcErrorType = {
    /** 
     * Numeric error code representing the type of error.
     * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes}
     */
    code: number;

    /** 
     * Human-readable message describing the error.
     */
    message: string;

    /** 
     * Optional metadata providing additional context about the error.
     * May include stack traces, request IDs, or debugging information.
     */
    data?: any;
};

// ============================================================================
// Discord OAuth2 Scopes
// ============================================================================

/**
 * Discord RPC OAuth2 Scopes.
 * 
 * @remarks
 * All available scopes for Discord RPC authentication.
 * Use these with the login() method.
 * 
 * @example
 * ```typescript
 * import { RPCScopes } from 'dc-rpc';
 * 
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: [RPCScopes.RPC, RPCScopes.RPC_ACTIVITIES_WRITE]
 * });
 * ```
 */
export const RPCScopes: {
    readonly IDENTIFY: 'identify';
    readonly EMAIL: 'email';
    readonly CONNECTIONS: 'connections';
    readonly GUILDS: 'guilds';
    readonly GUILDS_JOIN: 'guilds.join';
    readonly GUILDS_MEMBERS_READ: 'guilds.members.read';
    readonly RPC: 'rpc';
    readonly RPC_NOTIFICATIONS_READ: 'rpc.notifications.read';
    readonly RPC_VOICE_READ: 'rpc.voice.read';
    readonly RPC_VOICE_WRITE: 'rpc.voice.write';
    readonly RPC_ACTIVITIES_WRITE: 'rpc.activities.write';
    readonly MESSAGES_READ: 'messages.read';
    readonly APPLICATIONS_BUILDS_UPLOAD: 'applications.builds.upload';
    readonly APPLICATIONS_BUILDS_READ: 'applications.builds.read';
    readonly APPLICATIONS_COMMANDS: 'applications.commands';
    readonly APPLICATIONS_COMMANDS_UPDATE: 'applications.commands.update';
    readonly APPLICATIONS_COMMANDS_PERMISSIONS_UPDATE: 'applications.commands.permissions.update';
    readonly APPLICATIONS_STORE_UPDATE: 'applications.store.update';
    readonly APPLICATIONS_ENTITLEMENTS: 'applications.entitlements';
    readonly BOT: 'bot';
    readonly WEBHOOK_INCOMING: 'webhook.incoming';
    readonly RELATIONSHIPS_READ: 'relationships.read';
    readonly ACTIVITIES_READ: 'activities.read';
    readonly ACTIVITIES_WRITE: 'activities.write';
    readonly ROLE_CONNECTIONS_WRITE: 'role_connections.write';
    readonly VOICE: 'voice';
    readonly GDM_JOIN: 'gdm.join';
};

/**
 * Preset scope combinations for common use cases.
 * 
 * @remarks
 * Instead of manually listing scopes, use these presets for convenience.
 * 
 * @example
 * ```typescript
 * // Easy way - use preset name as string
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: 'RICH_PRESENCE'
 * });
 * 
 * // Or use the preset object
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: ScopePresets.RICH_PRESENCE
 * });
 * ```
 */
export const ScopePresets: {
    readonly BASIC: string[];
    readonly RICH_PRESENCE: string[];
    readonly VOICE_CONTROL: string[];
    readonly FULL_RPC: string[];
    readonly GUILD_ACCESS: string[];
    readonly USER_PROFILE: string[];
};

/**
 * Scope validation and helper utilities.
 * 
 * @example
 * ```typescript
 * // Validate scopes
 * const result = ScopeHelper.validateScopes(['rpc', 'invalid']);
 * if (!result.valid) {
 *   console.error('Invalid:', result.invalid);
 * }
 * 
 * // Merge presets
 * const scopes = ScopeHelper.merge(
 *   ScopePresets.RICH_PRESENCE,
 *   [RPCScopes.GUILDS]
 * );
 * 
 * // List all available
 * ScopeHelper.listAll();
 * ```
 */
export class ScopeHelper {
    /**
     * Check if a scope is valid.
     */
    static isValid(scope: string): boolean;

    /**
     * Validate an array of scopes.
     * @returns Object with validation result and invalid scopes
     */
    static validateScopes(scopes: string[]): {
        valid: boolean;
        invalid: string[];
    };

    /**
     * Get preset scopes by name.
     * @throws Error if preset not found
     */
    static getPreset(presetName: string): string[];

    /**
     * Merge multiple scope arrays (removes duplicates).
     */
    static merge(...scopeArrays: string[][]): string[];

    /**
     * Get description of a scope.
     */
    static describe(scope: string): string;

    /**
     * Print all available scopes with descriptions.
     */
    static listAll(): void;

    /**
     * Print all preset combinations.
     */
    static listPresets(): void;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login options with scope presets support.
 * 
 * @example
 * ```typescript
 * // Use preset name (recommended)
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: 'RICH_PRESENCE'
 * });
 * 
 * // Use custom scopes
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: [RPCScopes.RPC, RPCScopes.RPC_ACTIVITIES_WRITE]
 * });
 * 
 * // Merge preset + custom
 * await client.login({
 *   clientId: 'xxx',
 *   scopes: ScopeHelper.merge(
 *     ScopePresets.RICH_PRESENCE,
 *     [RPCScopes.GUILDS]
 *   )
 * });
 * ```
 */
export type LoginOptions = {
    /** 
     * The client ID of your Discord application.
     * @required
     */
    clientId: string;

    /** 
     * The client secret for confidential client flows.
     * @optional Only required for server-side applications
     */
    clientSecret?: string;

    /**
     * Scopes - can be:
     * - Preset name: 'RICH_PRESENCE', 'VOICE_CONTROL', etc.
     * - Array of scope strings
     * - undefined for no scopes
     */
    scopes?: string | string[];
};

/**
 * Extended login options with additional authentication methods.
 * 
 * @remarks
 * This class provides additional authentication parameters beyond the basic LoginOptions.
 * 
 * @example
 * ```typescript
 * const loginOptions = new RpcLoginOptions(
 *   'client_id',
 *   'client_secret',
 *   'access_token',
 *   'rpc_token',
 *   'https://discord.com/api/oauth2/token',
 *   ['rpc', 'identify']
 * );
 * ```
 */
export class RpcLoginOptions extends Object {
    /** Discord application client ID */
    clientId: string;

    /** Discord application client secret */
    clientSecret: string;

    /** OAuth2 access token for authentication */
    accessToken: string;

    /** RPC-specific token for direct authentication */
    rpcToken: string;

    /** Custom OAuth2 token endpoint URL */
    tokenEndpoint: string;

    /** Array of OAuth2 scopes to authorize */
    scopes: string[];

    /**
     * Creates a new RpcLoginOptions instance.
     * 
     * @param clientId - Discord application client ID
     * @param clientSecret - Discord application client secret
     * @param accessToken - OAuth2 access token
     * @param rpcToken - RPC authentication token
     * @param tokenEndpoint - OAuth2 token endpoint URL
     * @param scopes - Array of OAuth2 scopes
     */
    constructor(
        clientId: string,
        clientSecret: string,
        accessToken: string,
        rpcToken: string,
        tokenEndpoint: string,
        scopes: string[]
    );
}

export interface RpcClientOptions {
    /** Enable response caching (default: false) */
    enableCache?: boolean;

    /** Cache TTL in milliseconds (default: 5000) */
    cacheTTL?: number;

    /** Maximum concurrent requests (default: 5) */
    maxConcurrentRequests?: number;

    /** Request timeout in milliseconds (default: 10000) */
    requestTimeout?: number;

    /** Enable automatic reconnection (default: false) */
    autoReconnect?: boolean;

    /** Maximum reconnection attempts (default: 3) */
    maxReconnectAttempts?: number;

    /** Enable batch request optimization (default: false) */
    enableBatching?: boolean;

    /** Batch delay in milliseconds (default: 10) */
    batchDelay?: number;

    /** Maximum event listeners (default: 20) */
    maxListeners?: number;
}

// ============================================================================
// Voice Settings Types
// ============================================================================

/**
 * Comprehensive voice configuration settings for Discord RPC.
 * 
 * @remarks
 * These settings control audio input/output behavior, echo cancellation,
 * noise suppression, and voice transmission modes.
 * 
 * @example
 * ```typescript
 * const voiceSettings: VoiceSettings = {
 *   mute: false,
 *   deaf: false,
 *   automaticGainControl: true,
 *   echoCancellation: true,
 *   noiseSuppression: true,
 *   input: {
 *     volume: 80
 *   },
 *   output: {
 *     volume: 100
 *   },
 *   mode: {
 *     type: 'voice-activity',
 *     autoThreshold: true
 *   }
 * };
 * await client.setVoiceSettings(voiceSettings);
 * ```
 */
export type VoiceSettings = {
    /** Enable automatic gain control for consistent microphone volume */
    automaticGainControl?: boolean;

    /** Enable echo cancellation to reduce audio feedback */
    echoCancellation?: boolean;

    /** Enable noise suppression to filter background noise */
    noiseSuppression?: boolean;

    /** Enable Quality of Service (QoS) optimizations for better voice quality */
    qos?: boolean;

    /** Warn user about prolonged silence during voice activity */
    silenceWarning?: boolean;

    /** User is deafened (cannot hear others) */
    deaf?: boolean;

    /** User is muted (cannot transmit audio) */
    mute?: boolean;

    /** Input device and volume configuration */
    input?: {
        /** Device ID of the selected input device */
        device?: string;

        /** Input volume level (0-100) */
        volume?: number;
    };

    /** Output device and volume configuration */
    output?: {
        /** Device ID of the selected output device */
        device?: string;

        /** Output volume level (0-100) */
        volume?: number;
    };

    /** Voice transmission mode settings */
    mode?: {
        /** 
         * Transmission mode type
         * @example 'push-to-talk' | 'voice-activity'
         */
        type: string;

        /** Automatically determine voice activity threshold */
        autoThreshold?: boolean;

        /** Manual voice activity detection threshold (-100 to 0 dB) */
        threshold?: number;

        /** Custom keyboard shortcut for push-to-talk */
        shortcut?: any;

        /** Delay in milliseconds before voice transmission starts */
        delay?: number;
    };
};

// ============================================================================
// Activity/Presence Types
// ============================================================================

/**
 * Activity type enumeration for Discord Rich Presence.
 * 
 * @remarks
 * Determines how the user's activity is displayed in their Discord profile.
 * Each type renders differently in the Discord client UI.
 * 
 * @example
 * ```typescript
 * const activity: ActivityArgs = {
 *   type: ActivityType.Playing,
 *   details: 'Ranked Match',
 *   state: 'In Queue'
 * };
 * await client.setActivity(activity);
 * ```
 */
export enum ActivityType {
    /**
     * Displays as "Playing {name}"
     * @example "Playing Minecraft"
     */
    Playing = 0,

    /**
     * Displays as "Listening to {name}"
     * @example "Listening to Spotify"
     */
    Listening = 2,

    /**
     * Displays as "Watching {name}"
     * @example "Watching YouTube"
     */
    Watching = 3,

    /**
     * Displays as "Competing in {name}"
     * @example "Competing in Arena Tournament"
     */
    Competing = 5,
}

/**
 * Configuration for Discord Rich Presence activity.
 * 
 * @remarks
 * Rich Presence allows your application to display detailed information
 * about what the user is currently doing in Discord.
 * 
 * Images must be uploaded to your Discord application's asset library
 * or use external URLs (if supported).
 * 
 * @example
 * ```typescript
 * const activity: ActivityArgs = {
 *   type: ActivityType.Playing,
 *   state: 'In Lobby',
 *   details: 'Ranked Match - Level 42',
 *   startTimestamp: Date.now(),
 *   largeImageKey: 'game_logo',
 *   largeImageText: 'My Awesome Game',
 *   smallImageKey: 'character_icon',
 *   smallImageText: 'Warrior Class',
 *   partySize: 2,
 *   partyMax: 4,
 *   buttons: [
 *     { label: 'Join Game', url: 'https://example.com/join' }
 *   ]
 * };
 * await client.setActivity(activity);
 * ```
 * 
 * @see {@link https://discord.com/developers/docs/rich-presence/how-to}
 */
export type ActivityArgs = {
    /** Activity type determining display format */
    type: ActivityType;

    /** Short description of current activity (max 128 characters) */
    state?: string;

    /** Detailed information about the activity (max 128 characters) */
    details?: string;

    /** Unix timestamp (ms) or Date when activity started */
    startTimestamp?: Date | number;

    /** Unix timestamp (ms) or Date when activity will end */
    endTimestamp?: Date | number;

    /** Asset key for large image (uploaded to Discord application) */
    largeImageKey?: string;

    /** Tooltip text shown when hovering large image (max 128 characters) */
    largeImageText?: string;

    /** External URL for large image (alternative to largeImageKey) */
    largeImageUrl?: string;

    /** Asset key for small image (uploaded to Discord application) */
    smallImageKey?: string;

    /** Tooltip text shown when hovering small image (max 128 characters) */
    smallImageText?: string;

    /** External URL for small image (alternative to smallImageKey) */
    smallImageUrl?: string;

    /** Current party/group size */
    partySize?: number;

    /** Maximum party/group size */
    partyMax?: number;

    /** Unique identifier for the user's party */
    partyId?: string;

    /** Secret for match-based invites */
    matchSecret?: string;

    /** Secret for join invites */
    joinSecret?: string;

    /** Secret for spectate invites */
    spectateSecret?: string;

    /** 
     * Custom buttons displayed on the activity (max 2 buttons)
     * @remarks Only available for verified applications
     */
    buttons?: Array<{
        /** Button label text (max 32 characters) */
        label: string;

        /** URL to navigate when button is clicked */
        url: string;
    }>;

    /** Whether the activity represents an active game instance */
    instance?: boolean;
};

// ============================================================================
// Batch Request Types
// ============================================================================

/**
 * Batch request item.
 */
export interface BatchRequestItem {
    cmd: string;
    args?: any;
    evt?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique subscription key for event management.
 * 
 * @remarks
 * Used internally to track and manage event subscriptions.
 * 
 * @param event - The event name
 * @param args - Stringified event arguments
 * @returns A unique subscription identifier
 * 
 * @internal
 */
export declare function subKey(event: string, args: string): string;

// ============================================================================
// RPC Client Class
// ============================================================================

/**
 * Main client for interacting with Discord's Rich Presence RPC.
 * 
 * @remarks
 * This client handles connection, authentication, and communication with
 * Discord's local RPC server. It extends EventEmitter to provide event-based
 * communication patterns.
 * 
 * @example
 * ```typescript
 * import { RpcClient, ActivityType } from 'dc-rpc';
 * 
 * const client = new RpcClient();
 * 
 * // Connect and login
 * await client.login({
 *   clientId: '123456789012345678',
 *   scopes: ['rpc']
 * });
 * 
 * // Set activity
 * await client.setActivity({
 *   type: ActivityType.Playing,
 *   details: 'Exploring the world',
 *   state: 'Level 50'
 * });
 * 
 * // Listen for events
 * client.on('ready', () => {
 *   console.log('Connected to Discord');
 * });
 * 
 * // Cleanup
 * await client.destroy();
 * ```
 * 
 * @see {@link https://discord.com/developers/docs/topics/rpc}
 */
export declare class RpcClient extends EventEmitter {
    /** Current OAuth2 access token (null if not authenticated) */
    accessToken: string | null;

    /** Discord application client ID */
    clientId: string | null;

    /** Metadata about the connected Discord application */
    application: any;

    /** Information about the currently authenticated Discord user */
    user: any;

    /** Client configuration options */
    options: RpcClientOptions;

    /** Current reconnection attempt count */
    reconnectAttempts: number;

    /** Whether client is currently reconnecting */
    isReconnecting: boolean;

    /**
     * Creates a new enhanced RPC client.
     * 
     * @param options - Client configuration options
     */
    constructor(options?: RpcClientOptions);

    // ========================================================================
    // Connection & Authentication Methods
    // ========================================================================

    /**
     * Establishes connection to Discord's local RPC server.
     * 
     * @param clientId - Your Discord application's client ID
     * @returns Promise resolving to the client instance
     * 
     * @throws {Error} If connection fails or Discord client is not running
     * 
     * @example
     * ```typescript
     * await client.connect('123456789012345678');
     * ```
     */
    connect(clientId: string): Promise<this>;

    /**
     * Authenticates with Discord using OAuth2.
     * 
     * @param options - Login configuration options
     * @returns Promise resolving to the authenticated client instance
     * 
     * @throws {RpcErrorType} If authentication fails
     * 
     * @example
     * ```typescript
     * await client.login({
     *   clientId: '123456789012345678',
     *   scopes: ['rpc', 'activities.read']
     * });
     * ```
     */
    login(options: LoginOptions): Promise<this>;

    /**
     * Initiates the OAuth2 authorization flow.
     * 
     * @param options - Authorization options
     * @returns Promise resolving to the authorization code
     * 
     * @example
     * ```typescript
     * const code = await client.authorize({ scopes: ['identify'] });
     * ```
     */
    authorize(options?: any): Promise<string>;

    /**
     * Authenticates using an existing access token.
     * 
     * @param accessToken - Valid OAuth2 access token
     * @returns Promise resolving to the authenticated client
     * 
     * @example
     * ```typescript
     * await client.authenticate('your_access_token_here');
     * ```
     */
    authenticate(accessToken: string): Promise<this>;

    // ========================================================================
    // RPC Request Method
    // ========================================================================

    /**
     * Sends a raw RPC command to Discord.
     * 
     * @remarks
     * This is a low-level method used internally by other client methods.
     * Most users should use the higher-level wrapper methods instead.
     * 
     * @typeParam T - Expected response type
     * @param cmd - RPC command name
     * @param args - Command arguments
     * @param evt - Optional event name for subscription-based commands
     * @returns Promise resolving to the command response
     * 
     * @throws {RpcErrorType} If the command fails
     * 
     * @example
     * ```typescript
     * const guilds = await client.request('GET_GUILDS');
     * ```
     */
    request<T = any>(cmd: string, args?: any, evt?: string): Promise<T>;

    /**
     * Batch multiple requests for better performance.
     * 
     * @remarks
     * Only available if `enableBatching` option is true.
     * 
     * @example
     * ```typescript
     * const results = await client.batchRequest([
     *   { cmd: 'GET_GUILDS' },
     *   { cmd: 'GET_CHANNELS', args: { guild_id: 'xxx' } },
     *   { cmd: 'GET_VOICE_SETTINGS' }
     * ]);
     * ```
     */
    batchRequest(requests: BatchRequestItem[]): Promise<any[]>;

    // ========================================================================
    // Safe Event Listeners
    // ========================================================================

    /**
     * Register event listener with error handling and auto cleanup.
     * 
     * @returns Unsubscribe function
     * 
     * @example
     * ```typescript
     * const unsubscribe = client.safeOn('message', (data) => {
     *   // Handle message
     * });
     * 
     * // Later...
     * unsubscribe(); // Clean up
     * ```
     */
    safeOn(event: string, handler: (...args: any[]) => void): () => void;

    // ========================================================================
    // Static Helpers
    // ========================================================================

    /**
     * Get all available scopes.
     */
    static getScopes(): typeof RPCScopes;

    /**
     * Get scope presets.
     */
    static getScopePresets(): typeof ScopePresets;

    /**
     * Validate scopes array.
     */
    static validateScopes(scopes: string[]): {
        valid: boolean;
        invalid: string[];
    };

    // ========================================================================
    // Guild & Channel Methods
    // ========================================================================

    /**
     * Retrieves information about a specific guild (server).
     * 
     * @param id - Guild ID
     * @param timeout - Request timeout in milliseconds
     * @returns Promise resolving to guild data
     * 
     * @example
     * ```typescript
     * const guild = await client.getGuild('123456789012345678');
     * console.log(guild.name);
     * ```
     */
    getGuild(id: string, timeout?: number): Promise<any>;

    /**
     * Retrieves all guilds the user is a member of.
     * 
     * @param timeout - Request timeout in milliseconds
     * @returns Promise resolving to array of guild data
     * 
     * @example
     * ```typescript
     * const guilds = await client.getGuilds();
     * guilds.forEach(guild => console.log(guild.name));
     * ```
     */
    getGuilds(timeout?: number): Promise<any>;

    /**
     * Retrieves information about a specific channel.
     * 
     * @param id - Channel ID
     * @param timeout - Request timeout in milliseconds
     * @returns Promise resolving to channel data
     * 
     * @example
     * ```typescript
     * const channel = await client.getChannel('987654321098765432');
     * console.log(channel.name);
     * ```
     */
    getChannel(id: string, timeout?: number): Promise<any>;

    /**
     * Retrieves all channels in a specific guild.
     * 
     * @param id - Guild ID
     * @param timeout - Request timeout in milliseconds
     * @returns Promise resolving to array of channel data
     * 
     * @example
     * ```typescript
     * const channels = await client.getChannels('123456789012345678');
     * ```
     */
    getChannels(id: string, timeout?: number): Promise<any[]>;

    /**
     * Selects a voice channel for the user to join.
     * 
     * @param id - Voice channel ID
     * @param options - Selection options
     * @returns Promise resolving when channel is joined
     * 
     * @example
     * ```typescript
     * await client.selectVoiceChannel('voice_channel_id', {
     *   force: true
     * });
     * ```
     */
    selectVoiceChannel(id: string, options?: { timeout?: number; force?: boolean }): Promise<any>;

    /**
     * Selects a text channel.
     * 
     * @param id - Text channel ID
     * @param options - Selection options
     * @returns Promise resolving when channel is selected
     * 
     * @example
     * ```typescript
     * await client.selectTextChannel('text_channel_id');
     * ```
     */
    selectTextChannel(id: string, options?: { timeout?: number }): Promise<any>;

    // ========================================================================
    // Voice Settings Methods
    // ========================================================================

    /**
     * Sets certified audio devices for the application.
     * 
     * @param devices - Array of certified device configurations
     * @returns Promise resolving when devices are set
     */
    setCertifiedDevices(devices: any[]): Promise<any>;

    /**
     * Configures voice settings for a specific user.
     * 
     * @param id - User ID
     * @param settings - Voice settings to apply
     * @returns Promise resolving when settings are applied
     * 
     * @example
     * ```typescript
     * await client.setUserVoiceSettings('user_id', {
     *   volume: 80,
     *   mute: false
     * });
     * ```
     */
    setUserVoiceSettings(id: string, settings: any): Promise<any>;

    /**
     * Retrieves current voice settings.
     * 
     * @returns Promise resolving to current voice settings
     * 
     * @example
     * ```typescript
     * const settings = await client.getVoiceSettings();
     * console.log('Muted:', settings.mute);
     * ```
     */
    getVoiceSettings(): Promise<VoiceSettings>;

    /**
     * Updates voice settings for the client.
     * 
     * @param args - Voice settings to apply
     * @returns Promise resolving when settings are applied
     * 
     * @example
     * ```typescript
     * await client.setVoiceSettings({
     *   mute: false,
     *   deaf: false,
     *   input: { volume: 100 }
     * });
     * ```
     */
    setVoiceSettings(args: VoiceSettings): Promise<any>;

    /**
     * Captures keyboard shortcuts for push-to-talk or other features.
     * 
     * @remarks
     * The callback receives the pressed key and a stop function.
     * You MUST call the stop function before disconnecting to prevent
     * the user from needing to restart their Discord client.
     * 
     * @param callback - Function called when keys are captured
     * @returns Promise resolving to a stop function
     * 
     * @example
     * ```typescript
     * const stop = await client.captureShortcut((key, stop) => {
     *   console.log('Captured:', key);
     *   if (key.code === 'F4') {
     *     stop(); // Stop capturing
     *   }
     * });
     * 
     * // Later...
     * stop(); // Must call before disconnect
     * ```
     */
    captureShortcut(callback: (key: any, stop: () => void) => void): Promise<() => void>;

    // ========================================================================
    // Activity/Presence Methods
    // ========================================================================

    /**
     * Sets the Rich Presence activity for the authenticated user.
     * 
     * @param args - Activity configuration
     * @param pid - Process ID (defaults to current process)
     * @returns Promise resolving when activity is set
     * 
     * @example
     * ```typescript
     * await client.setActivity({
     *   type: ActivityType.Playing,
     *   details: 'Competitive Match',
     *   state: 'Ranked #42',
     *   startTimestamp: Date.now(),
     *   largeImageKey: 'game_logo',
     *   partySize: 2,
     *   partyMax: 5
     * });
     * ```
     */
    setActivity(args?: ActivityArgs, pid?: number): Promise<any>;

    /**
     * Clears the current Rich Presence activity.
     * 
     * @remarks
     * This removes the "Playing X" status from the user's profile.
     * 
     * @param pid - Process ID (defaults to current process)
     * @returns Promise resolving when activity is cleared
     * 
     * @example
     * ```typescript
     * await client.clearActivity();
     * ```
     */
    clearActivity(pid?: number): Promise<any>;

    // ========================================================================
    // Social/Invite Methods
    // ========================================================================

    /**
     * Sends an invite to a user to join your current activity.
     * 
     * @param user - User object to invite
     * @returns Promise resolving when invite is sent
     * 
     * @example
     * ```typescript
     * await client.sendJoinInvite(user);
     * ```
     */
    sendJoinInvite(user: any): Promise<any>;

    /**
     * Requests to join another user's activity.
     * 
     * @param user - User whose activity to join
     * @returns Promise resolving when request is sent
     * 
     * @example
     * ```typescript
     * await client.sendJoinRequest(targetUser);
     * ```
     */
    sendJoinRequest(user: any): Promise<any>;

    /**
     * Rejects a join request from a user.
     * 
     * @param user - User whose request to reject
     * @returns Promise resolving when request is rejected
     * 
     * @example
     * ```typescript
     * await client.closeJoinRequest(user);
     * ```
     */
    closeJoinRequest(user: any): Promise<any>;

    // ========================================================================
    // Lobby Methods
    // ========================================================================

    /**
     * Creates a new lobby.
     * 
     * @param type - Lobby type
     * @param capacity - Maximum number of members
     * @param metadata - Optional lobby metadata
     * @returns Promise resolving to lobby data
     * 
     * @example
     * ```typescript
     * const lobby = await client.createLobby('public', 10, {
     *   map: 'Desert Arena'
     * });
     * ```
     */
    createLobby(type: string, capacity: number, metadata?: any): Promise<any>;

    /**
     * Updates an existing lobby's properties.
     * 
     * @param lobby - Lobby object to update
     * @param options - Updated properties
     * @returns Promise resolving to updated lobby
     */
    updateLobby(lobby: any, options?: any): Promise<any>;

    /**
     * Deletes a lobby.
     * 
     * @param lobby - Lobby object to delete
     * @returns Promise resolving when lobby is deleted
     */
    deleteLobby(lobby: any): Promise<any>;

    /**
     * Connects to an existing lobby.
     * 
     * @param id - Lobby ID
     * @param secret - Lobby secret key
     * @returns Promise resolving to lobby data
     */
    connectToLobby(id: string, secret: string): Promise<any>;

    /**
     * Sends data to all members in a lobby.
     * 
     * @param lobby - Target lobby
     * @param data - Data to send
     * @returns Promise resolving when data is sent
     */
    sendToLobby(lobby: any, data: any): Promise<any>;

    /**
     * Disconnects from a lobby.
     * 
     * @param lobby - Lobby to disconnect from
     * @returns Promise resolving when disconnected
     */
    disconnectFromLobby(lobby: any): Promise<any>;

    /**
     * Updates metadata for a lobby member.
     * 
     * @param lobby - Target lobby
     * @param user - User to update
     * @param metadata - New metadata
     * @returns Promise resolving when updated
     */
    updateLobbyMember(lobby: any, user: any, metadata: any): Promise<any>;

    // ========================================================================
    // Relationships Methods
    // ========================================================================

    /**
     * Retrieves the user's relationships (friends, blocked users, etc.).
     * 
     * @returns Promise resolving to array of relationships
     * 
     * @example
     * ```typescript
     * const relationships = await client.getRelationships();
     * const friends = relationships.filter(r => r.type === 1);
     * ```
     */
    getRelationships(): Promise<any[]>;

    // ========================================================================
    // Event Subscription Methods
    // ========================================================================

    /**
     * Subscribes to a Discord RPC event.
     * 
     * @remarks
     * Returns an object with an unsubscribe method to stop listening.
     * 
     * @param event - Event name (e.g., 'MESSAGE_CREATE', 'VOICE_STATE_UPDATE')
     * @param args - Event-specific arguments
     * @returns Promise resolving to subscription object
     * 
     * @example
     * ```typescript
     * const subscription = await client.subscribe('MESSAGE_CREATE', {
     *   channel_id: '123456789012345678'
     * });
     * 
     * client.on('MESSAGE_CREATE', (message) => {
     *   console.log('New message:', message.content);
     * });
     * 
     * // Later...
     * await subscription.unsubscribe();
     * ```
     */
    subscribe(event: string, args?: any): Promise<{ unsubscribe: () => Promise<any> }>;

    // ========================================================================
    // Cleanup Methods
    // ========================================================================

    /**
     * Destroys the client and closes all connections.
     * 
     * @remarks
     * This method should always be called when you're done using the client
     * to properly clean up resources and close the RPC connection.
     * 
     * @returns Promise resolving when client is fully destroyed
     * 
     * @example
     * ```typescript
     * // Cleanup on process exit
     * process.on('beforeExit', async () => {
     *   await client.destroy();
     * });
     * ```
     */
    destroy(): Promise<void>;
}