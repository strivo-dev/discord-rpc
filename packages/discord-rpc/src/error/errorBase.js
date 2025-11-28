/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file errorBase.js
 */

'use strict';

const errorCode = require("./errorCode.js");
const Messages = require("./errorMsg");

function errorBase(Base) {
    return class DiscordRpcError extends Base {
        constructor(code, ...args) {
            super(message(code, args));
            this.code = code;
            Error.captureStackTrace?.(this, DiscordRpcError);
        }

        get name() {
            return `${super.name} [${this.code}]`;
        }
    };
}

function message(code, args) {
    if (!(code in errorCode)) throw new Error('Error code must be a valid Error Code');
    const msg = Messages[code];
    if (!msg) throw new Error(`No message associated with error code: ${code}.`);
    if (typeof msg === 'function') return msg(...args);
    if (!args?.length) return msg;
    args.unshift(msg);
    return String(...args);
}

module.exports = {
    RpcError: errorBase(Error),
    RpcRangeError: errorBase(RangeError),
    RpcTimeout: errorBase(Error),
    RpcTypeError: errorBase(TypeError),
    RpcSocketError: errorBase(Error),
    RpcTransportError: errorBase(Error),
};