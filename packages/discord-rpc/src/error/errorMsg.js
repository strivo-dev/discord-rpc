/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file errorMsg.js
 */

'use strict';

const errorCode = require('./errorCode');

const errorMsg = {
    [errorCode.RpcTimeout]: 'Connection timeout occurred while trying to reach the RPC service.',
    [errorCode.SocketError]: 'An error occurred with the socket connection.',
    [errorCode.TransportError]: 'Transport layer encountered an error.',
    [errorCode.InvalidTransport]: (transport) => `Invalid transport "${transport}". Valid transports are "ipc" or "websocket".`,
    [errorCode.FetchError]: (status) => `HTTP fetch failed with status: ${status}.`,
    [errorCode.ConnectionError]: (e) => `Connection was closed unexpectedly. ${e}`,
    [errorCode.MessageError]: (e) => `Received an invalid message from the RPC service. ${e}`,
    [errorCode.TimestampError]: (e) => `Received an invalid timestamp from the RPC service: "${e}"`,
    [errorCode.ConnectionFailed]: 'Could not connect to RPC',
    [errorCode.MissingEndpoint]: 'Could not find endpoint',
    [errorCode.FailLoadProtocol]: (e) => `Protocol registration failed. Details: ${e}`,
};

module.exports = errorMsg;