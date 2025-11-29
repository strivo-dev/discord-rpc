/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file errorBase.js
 */

'use strict';

/**
 * @typedef {Object} ErrorCode
 * 
 * @property {'RpcTimeout'} RpcTimeout
 * @property {'RpcSocketError'} RpcSocketError
 * @property {'RpcTransportError'} RpcTransportError
 * @property {'InvalidTransport'} InvalidTransport
 * @property {'FetchError'} FetchError
 * @property {'ConnectionError'} ConnectionError
 * @property {'MessageError'} MessageError
 * @property {'TimestampError'} TimestampError
 * @property {'ConnectionFailed'} ConnectionFailed
 * @property {'MissingEndpoint'} MissingEndpoint
 * @property {'FailLoadProtocol'} FailLoadProtocol
 * @property {'InvalidScope'} InvalidScope
 * @property {'InvalidScopePreset'} InvalidScopePreset
 * @property {'ScopeValidationFailed'} ScopeValidationFailed
 * @property {'InvalidScopeArray'} InvalidScopeArray
 * @property {'UnknownPresets'} UnknownPresets
 */

const keys = [
    'RpcTimeout',
    'SocketError',
    'TransportError',
    'InvalidTransport',
    'FetchError',
    'ConnectionError',
    'MessageError',
    'TimestampError',
    'ConnectionFailed',
    'MissingEndpoint',
    'FailLoadProtocol',
    'InvalidScope',
    'InvalidScopePreset',
    'ScopeValidationFailed',
    'InvalidScopeArray',
    'UnknownPresets',
];

/**
 * @type {DiscordRpcError}
 */
module.exports = Object.fromEntries(keys.map((key) => [key, key]));
