/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file index.js
 */

'use strict';

class RpcLoginOptions {
    /**
     * @param {Object} options - Login options
     * @param {string} options.clientId - Client ID
     * @param {string} [options.clientSecret] - Client secret
     * @param {string} [options.accessToken] - Access token
     * @param {string} [options.rpcToken] - RPC token
     * @param {string} [options.tokenEndpoint] - Token endpoint
     * @param {string[]} [options.scopes] - Scopes to authorize with
     */
    constructor({ clientId, clientSecret, accessToken, rpcToken, tokenEndpoint, scopes, enableMetrics } = {}) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = accessToken;
        this.rpcToken = rpcToken;
        this.tokenEndpoint = tokenEndpoint;
        this.scopes = scopes;
        this.enableMetrics = enableMetrics;
    }
}

module.exports = {
    RpcLoginOptions,
};