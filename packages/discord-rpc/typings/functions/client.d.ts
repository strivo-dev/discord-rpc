import { EventEmitter } from "events";

/**
 * Represents an error object encountered during RPC operations.
 */
export type RpcErrorType = {
    /** 
     * Numeric error code representing the type of error. 
     * Common values include application-specific codes such as:
     * - `1000`: Authentication failed.
     * - `4000`: Invalid request parameters.
     */
    code: number;

    /** 
     * A detailed message describing the nature of the error.
     * This message is typically user-readable.
     */
    message: string;

    /** 
     * Optional additional data associated with the error.
     * This could include debugging information or metadata related to the error.
     */
    data?: any;
};

/**
 * Represents options used during the login process for an RPC client.
 */
export type LoginOptions = {
    /** 
     * The client ID of the application used for authentication.
     * This is a mandatory field.
     */
    clientId: string;

    /** 
     * The client secret of the application, used for confidential client flows.
     * This is optional and may not be required for certain use cases.
     */
    clientSecret?: string;

    /** 
     * A list of scopes to request during the authentication process.
     * Scopes define the permissions and features the client can access.
     * Examples: `["rpc", "activities.read"]`
     */
    scopes?: string[];
};

/**
 * Represents voice configuration settings for the client.
 */
export type VoiceSettings = {
    /** Indicates if automatic gain control is enabled for the microphone input. */
    automaticGainControl?: boolean;

    /** Indicates if echo cancellation is applied to reduce echo in audio input. */
    echoCancellation?: boolean;

    /** Indicates if noise suppression is enabled for the microphone input. */
    noiseSuppression?: boolean;

    /** Indicates if Quality of Service (QoS) optimizations are enabled. */
    qos?: boolean;

    /** Indicates if the user should be warned about prolonged silence. */
    silenceWarning?: boolean;

    /** Indicates if the user is currently deafened (unable to hear others). */
    deaf?: boolean;

    /** Indicates if the user is currently muted (unable to transmit audio). */
    mute?: boolean;

    /** Configuration for the input audio device and settings. */
    input?: {
        /** The unique identifier of the selected input device. */
        device?: string;

        /** The input volume level, specified as a percentage (0–100). */
        volume?: number;
    };

    /** Configuration for the output audio device and settings. */
    output?: {
        /** The unique identifier of the selected output device. */
        device?: string;

        /** The output volume level, specified as a percentage (0–100). */
        volume?: number;
    };

    /** Advanced settings related to voice transmission modes. */
    mode?: {
        /** The transmission mode type, e.g., `"push-to-talk"` or `"voice-activity"`. */
        type: string;

        /** Whether the threshold for voice activity detection should be determined automatically. */
        autoThreshold?: boolean;

        /** A manual threshold value for voice activity detection, if applicable. */
        threshold?: number;

        /** A custom shortcut configuration for activating voice transmission. */
        shortcut?: any;

        /** The delay duration, in milliseconds, before activating voice transmission. */
        delay?: number;
    };
};

/**
 * Defines the parameters used for configuring a user's activity presence.
 */
export type ActivityArgs = {
    /** A short description of the current activity state (e.g., "Playing Solo"). */
    state?: string;

    /** Detailed information about the activity (e.g., "Level 5: Defeating the boss"). */
    details?: string;

    /** The start time of the activity, represented as a date or a Unix timestamp. */
    startTimestamp?: Date | number;

    /** The end time of the activity, represented as a date or a Unix timestamp. */
    endTimestamp?: Date | number;

    /** The key for the large image asset displayed in the activity. */
    largeImageKey?: string;

    /** Tooltip text for the large image asset. */
    largeImageText?: string;

    /** = */
    largeImageUrl?: string;

    /** The key for the small image asset displayed in the activity. */
    smallImageKey?: string;

    /** Tooltip text for the small image asset. */
    smallImageText?: string;

    /** = */
    smallImageUrl?: string;

    /** The current size of the party the user is in. */
    partySize?: number;

    /** A unique identifier for the user's party. */
    partyId?: string;

    /** The maximum size of the party the user is in. */
    partyMax?: number;

    /** A secret used for matching or connecting to the user's activity. */
    matchSecret?: string;

    /** A secret for others to join the user's activity. */
    joinSecret?: string;

    /** A secret for others to spectate the user's activity. */
    spectateSecret?: string;

    /** Custom buttons to display on the activity. */
    buttons?: [
        {
            /** Set buttons label */
            label: string;
            
            /** Direct to url when click the buttons */
            url: string;
        }
    ]

    /** Indicates whether the activity is active and being tracked. */
    instance?: boolean;

    /** Activity Types (Playing, Listening, Watching, Competing) */
    type: ActivityType;
};
/**
 * Represents different types of user activities that can be set in the client.
 * 
 * Each activity type determines how the status is displayed in the user's profile or presence.
 * These activities are often used in applications like Discord Rich Presence to 
 * provide additional context about what a user is currently doing.
 */
export enum ActivityType {
	/**
	 * Indicates that the user is playing a game.
	 * 
	 * The activity will be displayed as "Playing {game}", where `{game}` represents the name
	 * of the game or activity specified in the details.
	 */
	Playing,

	/**
	 * Indicates that the user is listening to something.
	 * 
	 * The activity will be displayed as "Listening to {name}", where `{name}` refers to the content 
	 * the user is listening to. This is commonly used for music streaming applications or audio-related activities.
	 */
	Listening,

	/**
	 * Indicates that the user is watching something.
	 * 
	 * The activity will be displayed as "Watching {details}", where `{details}` provides
	 * information about the video, stream, or content the user is viewing.
	 */
	Watching,

	/**
	 * Indicates that the user is competing in an event or activity.
	 * 
	 * The activity will be displayed as "Competing in {name}", where `{name}` represents the competition
	 * or event the user is participating in. This is often used for tournaments or competitive events.
	 */
    Competing,
}


/**
 * Generates a unique subscription key for a given event and its arguments.
 * @param event The name of the event to subscribe to.
 * @param args The arguments related to the event.
 * @returns A unique string key for identifying the subscription.
 */
export declare function subKey(event: string, args: string): string;

/**
 * Represents the primary client for interacting with Discord's RPC services.
 * Provides methods for authentication, managing user presence, and interacting with Discord features.
 */
export declare class RpcClient extends EventEmitter {
    /** The access token used for authenticated requests. */
    accessToken: string | null;

    /** The client ID of the application, used for identification and authentication. */
    clientId: string | null;

    /** Metadata about the application associated with the client. */
    application: any;

    /** Metadata about the user currently logged in to the client. */
    user: any;

    /**
     * Establishes a connection to Discord using the provided client ID.
     * @param clientId The client ID to use for the connection.
     * @returns A promise that resolves with the client instance upon successful connection.
     */
    connect(clientId: string): Promise<this>;

    /**
     * Logs in to Discord using the specified login options.
     * @param options The login options, including client ID and optional secrets or scopes.
     * @returns A promise that resolves with the client instance upon successful login.
     */
    login(options: LoginOptions): Promise<this>;

    /**
     * Sends a request to the Discord RPC service.
     * @param cmd The command to execute.
     * @param args Optional arguments for the command.
     * @param evt Optional event to subscribe to for results.
     * @returns A promise that resolves with the response data.
     */
    request<T = any>(cmd: string, args?: any, evt?: string): Promise<T>;

    authorize(options?: any): Promise<string>;
    authenticate(accessToken: string): Promise<this>;

    getGuild(id: string, timeout?: number): Promise<any>;
    getGuilds(timeout?: number): Promise<any>;

    getChannel(id: string, timeout?: number): Promise<any>;
    getChannels(id: string, timeout?: number): Promise<any[]>;

    setCertifiedDevices(devices: any[]): Promise<any>;

    selectVoiceChannel(id: string, options?: { timeout?: number; force?: boolean }): Promise<any>;
    selectTextChannel(id: string, options?: { timeout?: number }): Promise<any>;

    setUserVoiceSettings(id: string, settings: any): Promise<any>;
    /**
     * Retrieves voice settings currently applied to the client.
     * @returns A promise that resolves with the current voice settings.
     */
    getVoiceSettings(): Promise<VoiceSettings>;

    /**
     * Sets voice settings for the client.
     * @param args The new voice settings to apply.
     * @returns A promise that resolves upon successfully applying the settings.
     */
    setVoiceSettings(args: VoiceSettings): Promise<any>;

    /**
     * Capture a shortcut using the client
     * The callback takes (key, stop) where `stop` is a function that will stop capturing.
     * This `stop` function must be called before disconnecting or else the user will have
     * to restart their client.
     * @param {Function} callback Callback handling keys
     * @returns {Promise<Function>}
     */
    captureShortcut(callback: (key: any, stop: () => void) => void): Promise<() => void>;

    /**
     * Sets the presence for the logged in user.
     * @param {object} args The rich presence to pass.
     * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
     * @returns {Promise}
     */
    setActivity(args?: ActivityArgs, pid?: number): Promise<any>;

    /**
     * Clears the currently set presence, if any. This will hide the "Playing X" message
     * displayed below the user's name.
     * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
     * @returns {Promise}
     */
    clearActivity(pid?: number): Promise<any>;

    /**
     * Invite a user to join the game the RPC user is currently playing
     * @param {User} user The user to invite
     * @returns {Promise}
     */
    sendJoinInvite(user: any): Promise<any>;

    /**
     * Request to join the game the user is playing
     * @param {User} user The user whose game you want to request to join
     * @returns {Promise}
     */
    sendJoinRequest(user: any): Promise<any>;

    /**
     * Reject a join request from a user
     * @param {User} user The user whose request you wish to reject
     * @returns {Promise}
     */
    closeJoinRequest(user: any): Promise<any>;

    createLobby(type: string, capacity: number, metadata?: any): Promise<any>;
    updateLobby(lobby: any, options?: any): Promise<any>;
    deleteLobby(lobby: any): Promise<any>;
    connectToLobby(id: string, secret: string): Promise<any>;
    sendToLobby(lobby: any, data: any): Promise<any>;
    disconnectFromLobby(lobby: any): Promise<any>;
    updateLobbyMember(lobby: any, user: any, metadata: any): Promise<any>;
    
    getRelationships(): Promise<any[]>;

    /**
     * Subscribe to an event
     * @param {string} event Name of event e.g. `MESSAGE_CREATE`
     * @param {Object} [args] Args for event e.g. `{ channel_id: '1234' }`
     * @returns {Promise<Object>}
     */
    subscribe(event: string, args?: any): Promise<{ unsubscribe: () => Promise<any> }>;

    /**
     * Destroys the client, closing any active connections.
     * @returns A promise that resolves when the client is fully destroyed.
     */
    destroy(): Promise<void>;
}