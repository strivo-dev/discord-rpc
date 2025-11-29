import { EventEmitter } from 'events';
import { Socket } from 'net';

// ============================================================================
// IPC Namespace - Core Protocol Implementation
// ============================================================================

/**
 * Inter-Process Communication utilities for Discord RPC.
 * 
 * @remarks
 * This namespace provides low-level protocol implementation for communicating
 * with Discord's local RPC server through named pipes (Windows) or Unix sockets.
 * 
 * @namespace
 */
declare namespace IPC {
    /**
     * Operation codes for the IPC protocol.
     * 
     * @remarks
     * These codes define the type of message being sent/received through the IPC connection.
     * They follow Discord's RPC protocol specification.
     * 
     * @enum {number}
     */
    enum OPCodes {
        /** 
         * Initial handshake message.
         * Sent when establishing a new connection to negotiate protocol version.
         */
        HANDSHAKE = 0,

        /** 
         * Standard data frame.
         * Used for all regular RPC commands and responses.
         */
        FRAME = 1,

        /** 
         * Connection close message.
         * Signals that the connection should be terminated.
         */
        CLOSE = 2,

        /** 
         * Ping message.
         * Used to keep the connection alive and measure latency.
         */
        PING = 3,

        /** 
         * Pong response.
         * Reply to a ping message.
         */
        PONG = 4,
    }

    /**
     * Generic data structure for RPC messages.
     * 
     * @remarks
     * This flexible type allows for any JSON-serializable data to be transmitted.
     */
    interface RPCData {
        [key: string]: any;
    }

    /**
     * Decoded message structure from IPC stream.
     * 
     * @remarks
     * Contains the operation code and associated data for a received message.
     */
    interface DecodeCallback {
        /** The operation code identifying the message type */
        op: OPCodes;

        /** The message payload data */
        data: RPCData;
    }

    /**
     * Constructs the IPC path for a given Discord client instance.
     * 
     * @remarks
     * Discord supports multiple client instances (0-9).
     * This function generates the appropriate named pipe (Windows) or Unix socket path.
     * 
     * - Windows: `\\?\pipe\discord-ipc-{id}`
     * - macOS/Linux: `/tmp/discord-ipc-{id}` or `$XDG_RUNTIME_DIR/discord-ipc-{id}`
     * 
     * @param id - Discord client instance ID (0-9)
     * @returns The full path to the IPC socket/pipe
     * 
     * @example
     * ```typescript
     * const path = IPC.getIPCPath(0);
     * // Windows: \\?\pipe\discord-ipc-0
     * // Unix: /tmp/discord-ipc-0
     * ```
     */
    function getIPCPath(id: number): string;

    /**
     * Creates a connection to Discord's IPC server.
     * 
     * @remarks
     * Attempts to connect to the specified Discord client instance.
     * 
     * @param id - Discord client instance ID (default: 0)
     * @returns Promise resolving to connected Socket
     * 
     * @throws {Error} If connection fails
     * 
     * @example
     * ```typescript
     * const socket = await IPC.getIPC(0);
     * ```
     */
    function getIPC(id?: number): Promise<Socket>;

    /**
     * Searches for an available Discord client endpoint.
     * 
     * @remarks
     * Iterates through Discord client instances (0-9) until a working connection is found.
     * This is useful when you don't know which instance the user is running.
     * 
     * @param tries - Maximum number of instances to try (default: 10)
     * @returns Promise resolving to the IPC path of the first available endpoint
     * 
     * @throws {Error} If no available endpoint is found
     * 
     * @example
     * ```typescript
     * try {
     *   const endpoint = await IPC.findEndpoint();
     *   console.log('Found Discord at:', endpoint);
     * } catch (error) {
     *   console.error('Discord not running');
     * }
     * ```
     */
    function findEndpoint(tries?: number): Promise<string>;

    /**
     * Encodes data into the IPC protocol format.
     * 
     * @remarks
     * Converts operation code and data into a Buffer following Discord's IPC protocol:
     * - Bytes 0-3: Operation code (32-bit little-endian integer)
     * - Bytes 4-7: Data length (32-bit little-endian integer)
     * - Bytes 8+: JSON-encoded data
     * 
     * @param op - The operation code
     * @param data - The data to encode
     * @returns Encoded Buffer ready for transmission
     * 
     * @example
     * ```typescript
     * const buffer = IPC.encode(IPC.OPCodes.FRAME, {
     *   cmd: 'SET_ACTIVITY',
     *   args: { state: 'Playing' }
     * });
     * socket.write(buffer);
     * ```
     */
    function encode(op: OPCodes, data: RPCData): Buffer;

    /**
     * Decodes incoming IPC data from a socket stream.
     * 
     * @remarks
     * Parses the binary protocol and invokes the callback with decoded messages.
     * Handles partial messages and stream reassembly automatically.
     * 
     * @param socket - The socket to read from
     * @param callback - Function called for each decoded message
     * 
     * @example
     * ```typescript
     * IPC.decode(socket, ({ op, data }) => {
     *   if (op === IPC.OPCodes.FRAME) {
     *     console.log('Received:', data);
     *   }
     * });
     * ```
     */
    function decode(socket: Socket, callback: (data: DecodeCallback) => void): void;
}

// ============================================================================
// IPCTransport Class - High-Level Transport Layer
// ============================================================================

/**
 * High-level transport layer for Discord RPC over IPC.
 * 
 * @remarks
 * This class manages the connection lifecycle, handles protocol details,
 * and provides a simple interface for sending/receiving RPC messages.
 * 
 * It extends EventEmitter to provide event-based communication:
 * - `'open'`: Connection established
 * - `'close'`: Connection closed
 * - `'message'`: RPC message received
 * 
 * @example
 * ```typescript
 * const transport = new IPCTransport({
 *   clientId: '123456789012345678'
 * });
 * 
 * transport.on('open', () => {
 *   console.log('Connected to Discord');
 * });
 * 
 * transport.on('message', (message) => {
 *   console.log('Received:', message);
 * });
 * 
 * await transport.connect();
 * 
 * transport.send({
 *   cmd: 'SET_ACTIVITY',
 *   args: { state: 'Playing' }
 * });
 * 
 * await transport.close();
 * ```
 */
export declare class IPCTransport extends EventEmitter {
    /**
     * Client configuration and state.
     * 
     * @remarks
     * Contains the client ID and optional custom endpoint configuration.
     */
    client: {
        /** Discord application client ID */
        clientId: string;

        /** Request configuration */
        request: {
            /** Custom IPC endpoint path (optional) */
            endpoint?: string;
        };
    };

    /**
     * The underlying socket connection.
     * 
     * @remarks
     * Null when not connected. Contains the active Node.js Socket when connected.
     */
    socket: Socket | null;

    /**
     * Creates a new IPC transport instance.
     * 
     * @param client - Client configuration object
     * @param client.clientId - Discord application client ID
     * 
     * @example
     * ```typescript
     * const transport = new IPCTransport({
     *   clientId: '123456789012345678'
     * });
     * ```
     */
    constructor(client: { clientId: string });

    /**
     * Establishes connection to Discord's IPC server.
     * 
     * @remarks
     * This method:
     * 1. Searches for an available Discord client endpoint
     * 2. Opens a socket connection
     * 3. Performs the handshake
     * 4. Starts the keep-alive ping mechanism
     * 
     * Emits 'open' event when connection is fully established.
     * 
     * @returns Promise resolving when connection is established
     * 
     * @throws {Error} If Discord client is not running or connection fails
     * 
     * @example
     * ```typescript
     * try {
     *   await transport.connect();
     *   console.log('Connected successfully');
     * } catch (error) {
     *   console.error('Failed to connect:', error.message);
     * }
     * ```
     */
    connect(): Promise<void>;

    /**
     * Handles connection close events.
     * 
     * @remarks
     * This method is called automatically when the connection is closed,
     * either gracefully or due to an error.
     * 
     * @param e - Close event details
     * 
     * @fires close
     * 
     * @internal
     */
    onClose(e: any): void;

    /**
     * Sends data through the IPC connection.
     * 
     * @remarks
     * Automatically encodes the data using the IPC protocol before sending.
     * 
     * @param data - The RPC data to send
     * @param op - Operation code (default: FRAME)
     * 
     * @throws {Error} If not connected
     * 
     * @example
     * ```typescript
     * // Send a standard RPC command
     * transport.send({
     *   cmd: 'SET_ACTIVITY',
     *   args: {
     *     state: 'In Game',
     *     details: 'Playing ranked'
     *   }
     * });
     * 
     * // Send a ping
     * transport.send({}, IPC.OPCodes.PING);
     * ```
     */
    send(data: IPC.RPCData, op?: IPC.OPCodes): void;

    /**
     * Closes the IPC connection gracefully.
     * 
     * @remarks
     * Sends a CLOSE opcode to Discord and terminates the socket connection.
     * 
     * @returns Promise resolving when connection is closed
     * 
     * @fires close
     * 
     * @example
     * ```typescript
     * await transport.close();
     * console.log('Disconnected from Discord');
     * ```
     */
    close(): Promise<void>;

    /**
     * Sends a ping to keep the connection alive.
     * 
     * @remarks
     * Called automatically by an internal interval to prevent timeout.
     * Can also be called manually to check connection health.
     * 
     * @example
     * ```typescript
     * transport.ping(); // Manual ping
     * ```
     */
    ping(): void;
}

// ============================================================================
// Exported Utility Functions
// ============================================================================

/**
 * Encodes data for IPC transmission.
 * 
 * @see {@link IPC.encode}
 * @export
 */
export const encode: typeof IPC.encode;

/**
 * Decodes IPC data from a socket stream.
 * 
 * @see {@link IPC.decode}
 * @export
 */
export const decode: typeof IPC.decode;