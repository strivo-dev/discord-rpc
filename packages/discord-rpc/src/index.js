/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file index.js
 */

'use strict';

const util = require('./functions/util');

// Rpc Main Classes
module.exports = {
    RpcClient: require('./functions/client'),
    ActivityType: require('./functions/constants').ActivityType,
    register(id) {
        return util.register(`discord-${id}`);
    },
};

// Errors
exports.AfkError = require('./error/errorBase').AfkError;
exports.AfkTypeError = require('./error/errorBase').AfkTypeError;
exports.errorCode = require('./error/errorCode');

// discord-rpc versions
exports.versions = `${require("../package.json").version}`;