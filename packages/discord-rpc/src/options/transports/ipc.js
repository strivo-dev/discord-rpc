/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file ipc.js
 */

'use strict';

const net = require('net');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const {
  uuid
} = require('../../functions/util.js');
const {
  RpcError,
  errorCode
} = require('../../error');

const OPCodes = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
};

function getIPCPath(id) {
  if (process.platform === 'win32') {
    return `\\\\?\\pipe\\discord-ipc-${id}`;
  };
  const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
  const prefix = XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || '/tmp';
  return `${prefix.replace(/\/$/, '')}/discord-ipc-${id}`;
};

function getIPC(id = 0) {
  return new Promise((resolve, reject) => {
    const path = getIPCPath(id);
    const onerror = () => {
      if (id < 10) {
        resolve(getIPC(id + 1));
      } else {
        reject(new RpcError(errorCode.ConnectionFailed));
      };
    };
    const sock = net.createConnection(path, () => {
      sock.removeListener('error', onerror);
      resolve(sock);
    });
    sock.once('error', onerror);
  });
};

async function findEndpoint(tries = 0) {
  if (tries > 30) {
    throw new RpcError(errorCode.MissingEndpoint);
  };
  const endpoint = `http://127.0.0.1:${6463 + (tries % 10)}`;
  try {
    const r = await fetch(endpoint);
    if (r.status === 404) {
      return endpoint;
    };
    return findEndpoint(tries + 1);
  } catch (e) {
    return findEndpoint(tries + 1);
  };
};

function encode(op, data) {
  data = JSON.stringify(data);

  const len = Buffer.byteLength(data);
  const packet = Buffer.allocUnsafe(8 + len);

  packet.writeInt32LE(op, 0);
  packet.writeInt32LE(len, 4);
  packet.write(data, 8, len);
  return packet;
};

const socketState = new WeakMap();

function decode(socket, callback) {
  const packet = socket.read();
  if (!packet) return;

  // Get or initialize state for this socket
  let state = socketState.get(socket);
  if (!state) {
    state = { full: '', op: undefined };
    socketState.set(socket, state);
  }

  let { op } = state;
  let raw;

  if (state.full === '') {
    op = state.op = packet.readInt32LE(0);
    const len = packet.readInt32LE(4);
    raw = packet.slice(8, len + 8);
  } else {
    raw = packet.toString();
  }

  try {
    const data = JSON.parse(state.full + raw);
    callback({ op, data });
    state.full = '';
    state.op = undefined;
  } catch (err) {
    state.full += raw;
  }

  decode(socket, callback);
};

class IPCTransport extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this.socket = null;
  };

  async connect() {
    const socket = this.socket = await getIPC();
    socket.on('close', this.onClose.bind(this));
    socket.on('error', this.onClose.bind(this));
    this.emit('open');
    socket.write(encode(OPCodes.HANDSHAKE, {
      v: 1,
      client_id: this.client.clientId,
    }));
    socket.pause();
    socket.on('readable', () => {
      decode(socket, ({ op, data }) => {
        switch (op) {
          case OPCodes.PING:
            this.send(data, OPCodes.PONG);
            break;
          case OPCodes.FRAME:
            if (!data) {
              return;
            };
            if (data.cmd === 'AUTHORIZE' && data.evt !== 'ERROR') {
              findEndpoint()
                .then((endpoint) => {
                  this.client.request.endpoint = endpoint;
                }).catch((e) => {
                  this.client.emit('error', e);
                });
            };
            this.emit('message', data);
            break;
          case OPCodes.CLOSE:
            this.emit('close', data);
            break;
          default:
            break;
        };
      });
    });
  };

  onClose(e) {
    socketState.delete(this.socket); // Cleanup state
    this.emit('close', e);
  };

  send(data, op = OPCodes.FRAME) {
    this.socket.write(encode(op, data));
  };

  async close() {
    return new Promise((r) => {
      this.once('close', r);
      this.send({}, OPCodes.CLOSE);
      this.socket.end();
    });
  };

  ping() {
    this.send(uuid(), OPCodes.PING);
  };
};

module.exports = IPCTransport;
module.exports.encode = encode;
module.exports.decode = decode;
