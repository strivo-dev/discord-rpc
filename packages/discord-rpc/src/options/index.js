/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file index.js
 */

'use strict';

class RpcClientOptions extends Object {
    constructor(transport) {
        /**
         * @param {string} transport
         * RPC transport. one of `ipc` or `websocket`
         * You must provide a transport
         */
        this.transport = transport;
    };
};

class RpcLoginOptions extends Object {
    constructor(clientId, clientSecret, accessToken, rpcToken, tokenEndpoint, scopes) {
        /**
         * @param {string} clientId Client ID
         */
        this.clientId = clientId;
        /**
         * @param {string} clientSecret Client secret
         */
        this.clientSecret = clientSecret;
        /**
         * @param {string} accessToken Access token
         */
        this.accessToken = accessToken;
        /**
         * @param {string} rpcToken RPC token
         */
        this.rpcToken = rpcToken;
        /**
         * @param {string} tokenEndpoint Token endpoint
         */
        this.tokenEndpoint = tokenEndpoint;
        /**
         * @param {string[]} scopes Scopes to authorize with
         */
        this.scopes = scopes;
    };
};
module.exports = {
    RpcClientOptions,
    RpcLoginOptions
};