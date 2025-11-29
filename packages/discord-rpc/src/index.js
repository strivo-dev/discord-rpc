/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file index.js
 */

'use strict';

const util = require('./functions/util');
const RpcClient = require('./functions/client');
const { ActivityType } = require('./functions/constants');
const { RPCScopes, ScopePresets, ScopeHelper } = require('./functions/scopes');

// RPC Main Class
module.exports = {
    // Client
    RpcClient,

    // Activity
    ActivityType,

    // Scopes
    RPCScopes,
    ScopePresets,
    ScopeHelper,

    // Utility
    register(id) {
        return util.register(`discord-${id}`);
    },
};

// discord-rpc versions
module.exports.version = `${require("../package.json").version}`;