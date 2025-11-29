/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file client.js
 */

'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch').default;
const transports = require('../options/transports');
const { setTimeout, clearTimeout } = require('timers');
const {
  RPCCommands,
  RPCEvents,
  RelationshipTypes,
  ActivityType
} = require('./constants.js');
const {
  pid: getPid,
  uuid
} = require('./util.js');
const {
  RpcError,
  RpcRangeError,
  RpcTimeout,
  RpcTypeError,
  errorCode
} = require('../error');
const { RPCScopes, ScopePresets, ScopeHelper } = require('./scopes.js');

function subKey(event, args) {
  return `${event}${JSON.stringify(args)}`;
};

class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(fn) {
    if (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

class ResponseCache {
  constructor(ttl = 5000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

class RpcClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.accessToken = null;
    this.clientId = null;
    this.application = null;
    this.user = null;

    this.options = {
      enableCache: options.enableCache || false,
      batchDelay: options.batchDelay || 10,
      cacheTTL: options.cacheTTL || 5000,
      maxConcurrentRequests: options.maxConcurrentRequests || 5,
      requestTimeout: options.requestTimeout || 10000,
      autoReconnect: options.autoReconnect || false,
      maxReconnectAttempts: options.maxReconnectAttempts || 3,
      ...options,
    };

    this.setMaxListeners(options.maxListeners || 20);

    this._batchQueue = [];
    this._batchTimer = null;

    this.requestQueue = new RequestQueue(this.options.maxConcurrentRequests);

    if (this.options.enableCache) {
      this.cache = new ResponseCache(this.options.cacheTTL);
    }

    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    this.fetch = (method, path, { data, query } = {}) =>
      fetch(`${this.endpoint}${path}${query ? new URLSearchParams(query) : ''}`, {
        method,
        body: data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) {
            const e = new RpcError(
              errorCode.FetchError,
              r.status
            );
            e.body = body;
            throw e;
          }
          return body;
        });

    this.endpoint = 'https://discord.com/api';
    this.transport.on('message', this._onRpcMessage.bind(this));
    this._expecting = new Map();
    this._connectPromise = undefined;
    this._boundListeners = new Map();
  };

  connect(clientId) {
    if (this._connectPromise) {
      return this._connectPromise;
    };

    this._connectPromise = new Promise((resolve, reject) => {
      this.clientId = clientId;
      const timeout = setTimeout(() => {
        reject(new RpcTimeout(errorCode.RpcTimeout));
      }, this.options.requestTimeout);

      timeout.unref();

      this.once('connected', () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        resolve(this);
      });

      this.transport.once('close', (event) => {
        this._expecting.forEach((e) => {
          e.reject(new RpcError(
            errorCode.ConnectionError,
            `${event.code}: ${event.reason}`
          ));
        });

        this.emit('disconnected');
        if (this.options.autoReconnect && !this.isReconnecting) {
          this._tryReconnect(clientId);
        }

        reject(new RpcError(
          errorCode.ConnectionError,
          `${event.code}: ${event.reason}`
        ));
      });

      this.transport.connect().catch(reject);
    });

    return this._connectPromise;
  };

  async login(loginOptions) {
    const { clientId, clientSecret } = loginOptions;
    let { scopes } = loginOptions;

    if (scopes) {
      if (typeof scopes === 'string') {
        const presetName = scopes.toUpperCase();

        if (!ScopePresets[presetName]) {
          const available = Object.keys(ScopePresets).join(', ');
          throw new RpcError(
            errorCode.InvalidScopePreset,
            `Invalid scope preset: "${scopes}". Available: ${available}`
          );
        }
        scopes = [...ScopePresets[presetName]];
        this.emit('debug', `Using scope preset: ${loginOptions.scopes} = ${scopes.join(', ')}`);
      }

      if (!Array.isArray(scopes)) {
        throw new RpcError(errorCode.InvalidScopeArray);
      }

      const validation = ScopeHelper.validateScopes(scopes);
      if (!validation.valid) {
        throw new RpcTypeError(errorCode.InvalidScope, validation.invalid);
      }
    }
    await this.connect(clientId);

    if (!scopes) {
      this.emit('ready');
      return this;
    }

    const accessToken = await this.authorize({
      clientId,
      clientSecret,
      scopes,
    });

    return this.authenticate(accessToken);
  };

  request(cmd, args, evt) {
    return this.requestQueue.add(() => {
      return new Promise((resolve, reject) => {
        const nonce = uuid();

        const timeout = setTimeout(() => {
          this._expecting.delete(nonce);
          reject(new RpcTimeout(errorCode.RpcTimeout));
        }, this.options.requestTimeout);

        this._expecting.set(nonce, {
          resolve: (data) => {
            clearTimeout(timeout);
            resolve(data);
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        });

        this.transport.send({ cmd, args, evt, nonce });
      });
    });
  };

  async _tryReconnect(clientId) {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('error', new RpcError(
        errorCode.ConnectionFailed,
        `Failed to reconnect after ${this.reconnectAttempts} attempts`
      ));
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    this.emit('reconnecting', this.reconnectAttempts);

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      this._connectPromise = undefined;
      await this.connect(clientId);
      this.isReconnecting = false;
      this.emit('reconnected');
    } catch (e) {
      this._tryReconnect(clientId);
    }
  }

  _onRpcMessage(message) {
    if (message.cmd === RPCCommands.DISPATCH && message.evt === RPCEvents.READY) {
      if (message.data.user) {
        this.user = message.data.user;
      };
      this.emit('connected');
    } else if (this._expecting.has(message.nonce)) {
      const { resolve, reject } = this._expecting.get(message.nonce);

      if (message.evt === 'RpcError') {
        const e = new RpcError(errorCode.MessageError, message.data.message);
        e.code = message.data.code;
        e.data = message.data;
        reject(e);
      } else {
        resolve(message.data);
      };
      this._expecting.delete(message.nonce);
    } else {
      this.emit(message.evt, message.data);
    };
  };

  async authorize({ scopes, clientSecret, rpcToken, redirectUri, prompt } = {}) {
    if (clientSecret && rpcToken === true) {
      const body = await this.fetch('POST', '/oauth2/token/rpc', {
        data: new URLSearchParams({
          client_id: this.clientId,
          client_secret: clientSecret,
        }),
      });
      rpcToken = body.rpc_token;
    };

    const { code } = await this.request('AUTHORIZE', {
      scopes,
      client_id: this.clientId,
      prompt,
      rpc_token: rpcToken,
    });

    const response = await this.fetch('POST', '/oauth2/token', {
      data: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      }),
    });
    return response.access_token;
  };

  async authenticate(accessToken) {
    return this.request('AUTHENTICATE', { access_token: accessToken })
      .then(({ application, user }) => {
        this.accessToken = accessToken;
        this.application = application;
        this.user = user;
        this.emit('ready');
        return this;
      }).catch(e => {
        throw new RpcTypeError(e);
      });
  };

  async batchRequest(requests) {
    if (!this.options.enableBatching) {
      return Promise.all(requests.map(r => this.request(r.cmd, r.args, r.evt)));
    }

    return new Promise((resolve) => {
      this._batchQueue.push(...requests.map(r => ({
        ...r,
        resolve,
      })));

      if (this._batchTimer) {
        clearTimeout(this._batchTimer);
      }

      this._batchTimer = setTimeout(() => {
        this._processBatch();
      }, this.options.batchDelay);
    });
  }

  _processBatch() {
    const batch = this._batchQueue.splice(0);
    const promises = batch.map(item =>
      this.request(item.cmd, item.args, item.evt)
    );

    Promise.all(promises).then(results => {
      batch.forEach((item, i) => item.resolve(results[i]));
    });
  }

  getScopes() {
    return RPCScopes;
  }

  getScopePresets() {
    return ScopePresets;
  }

  validateScopes(scopes) {
    return ScopeHelper.validateScopes(scopes);
  }

  getGuild(id, timeout) {
    return this.request(RPCCommands.GET_GUILD, { guild_id: id, timeout });
  };

  getGuilds(timeout) {
    return this.request(RPCCommands.GET_GUILDS, { timeout });
  };

  getChannel(id, timeout) {
    return this.request(RPCCommands.GET_CHANNEL, { channel_id: id, timeout });
  };

  getSelectedVoiceChannel(timeout) {
    return this.request(RPCCommands.GET_SELECTED_VOICE_CHANNEL, { timeout });
  }

  async getChannels(id, timeout) {
    const { channels } = await this.request(RPCCommands.GET_CHANNELS, {
      timeout,
      guild_id: id,
    });
    return channels;
  };

  setCertifiedDevices(devices) {
    return this.request(RPCCommands.SET_CERTIFIED_DEVICES, {
      devices: devices.map((d) => ({
        type: d.type,
        id: d.uuid,
        vendor: d.vendor,
        model: d.model,
        related: d.related,
        echo_cancellation: d.echoCancellation,
        noise_suppression: d.noiseSuppression,
        automatic_gain_control: d.automaticGainControl,
        hardware_mute: d.hardwareMute,
      })),
    });
  };


  setUserVoiceSettings(id, settings) {
    return this.request(RPCCommands.SET_USER_VOICE_SETTINGS, {
      user_id: id,
      pan: settings.pan,
      mute: settings.mute,
      volume: settings.volume,
    });
  };

  selectVoiceChannel(id, { timeout, force = false } = {}) {
    return this.request(RPCCommands.SELECT_VOICE_CHANNEL, { channel_id: id, timeout, force });
  };

  selectTextChannel(id, { timeout } = {}) {
    return this.request(RPCCommands.SELECT_TEXT_CHANNEL, { channel_id: id, timeout });
  };

  async getVoiceSettings() {
    return this.request(RPCCommands.GET_VOICE_SETTINGS).then((s) => ({
      automaticGainControl: s.automatic_gain_control,
      echoCancellation: s.echo_cancellation,
      noiseSuppression: s.noise_suppression,
      qos: s.qos,
      silenceWarning: s.silence_warning,
      deaf: s.deaf,
      mute: s.mute,
      input: {
        availableDevices: s.input.available_devices,
        device: s.input.device_id,
        volume: s.input.volume,
      },
      output: {
        availableDevices: s.output.available_devices,
        device: s.output.device_id,
        volume: s.output.volume,
      },
      mode: {
        type: s.mode.type,
        autoThreshold: s.mode.auto_threshold,
        threshold: s.mode.threshold,
        shortcut: s.mode.shortcut,
        delay: s.mode.delay,
      },
    }));
  };

  setVoiceSettings(args) {
    return this.request(RPCCommands.SET_VOICE_SETTINGS, {
      automatic_gain_control: args.automaticGainControl,
      echo_cancellation: args.echoCancellation,
      noise_suppression: args.noiseSuppression,
      qos: args.qos,
      silence_warning: args.silenceWarning,
      deaf: args.deaf,
      mute: args.mute,
      input: args.input ? {
        device_id: args.input.device,
        volume: args.input.volume,
      } : undefined,
      output: args.output ? {
        device_id: args.output.device,
        volume: args.output.volume,
      } : undefined,
      mode: args.mode ? {
        type: args.mode.type,
        auto_threshold: args.mode.autoThreshold,
        threshold: args.mode.threshold,
        shortcut: args.mode.shortcut,
        delay: args.mode.delay,
      } : undefined,
    });
  };

  async captureShortcut(callback) {
    const subid = subKey(RPCEvents.CAPTURE_SHORTCUT_CHANGE);
    const stop = () => {
      this._subscriptions.delete(subid);
      return this.request(RPCCommands.CAPTURE_SHORTCUT, { action: 'STOP' });
    };
    this._subscriptions.set(subid, ({ shortcut }) => {
      callback(shortcut, stop);
    });
    return this.request(RPCCommands.CAPTURE_SHORTCUT, { action: 'START' }).then(() => stop);
  };

  setActivity(args = {}, pid = getPid()) {
    let timestamps;
    let assets;
    let party;
    let secrets;
    let type = ActivityType.Playing;

    if (args.startTimestamp || args.endTimestamp) {
      timestamps = {
        start: args.startTimestamp,
        end: args.endTimestamp,
      };
      if (timestamps.start instanceof Date) {
        timestamps.start = Math.round(timestamps.start.getTime());
      };
      if (timestamps.end instanceof Date) {
        timestamps.end = Math.round(timestamps.end.getTime());
      };
      if (timestamps.start > 2147483647000) {
        throw new RpcRangeError(errorCode.TimestampError, 'timestamps.start');
      };
      if (timestamps.end > 2147483647000) {
        throw new RpcRangeError(errorCode.TimestampError, 'timestamps.end');
      };
    };
    if (
      args.largeImageKey || args.largeImageText
      || args.smallImageKey || args.smallImageText
      || args.largeImageUrl || args.smallImageUrl
    ) {
      assets = {
        large_image: args.largeImageKey,
        large_text: args.largeImageText,
        large_url: args.largeImageUrl,
        small_image: args.smallImageKey,
        small_text: args.smallImageText,
        small_url: args.smallImageUrl,
      };
    };
    if (args.partySize || args.partyId || args.partyMax) {
      party = { id: args.partyId };
      if (args.partySize || args.partyMax) {
        party.size = [args.partySize, args.partyMax];
      };
    };
    if (args.matchSecret || args.joinSecret || args.spectateSecret) {
      secrets = {
        match: args.matchSecret,
        join: args.joinSecret,
        spectate: args.spectateSecret,
      };
    };
    if (args.type) {
      type = args.type;
    };

    return this.request(RPCCommands.SET_ACTIVITY, {
      pid,
      activity: {
        state: args.state,
        details: args.details,
        type,
        timestamps,
        assets,
        party,
        secrets,
        buttons: args.buttons,
        instance: !!args.instance,
      },
    });
  };

  clearActivity(pid = getPid()) {
    return this.request(RPCCommands.SET_ACTIVITY, {
      pid,
    });
  };

  sendJoinInvite(user) {
    return this.request(RPCCommands.SEND_ACTIVITY_JOIN_INVITE, {
      user_id: user.id || user,
    });
  };

  sendJoinRequest(user) {
    return this.request(RPCCommands.SEND_ACTIVITY_JOIN_REQUEST, {
      user_id: user.id || user,
    });
  };

  closeJoinRequest(user) {
    return this.request(RPCCommands.CLOSE_ACTIVITY_JOIN_REQUEST, {
      user_id: user.id || user,
    });
  };

  createLobby(type, capacity, metadata) {
    return this.request(RPCCommands.CREATE_LOBBY, {
      type,
      capacity,
      metadata,
    });
  };

  updateLobby(lobby, { type, owner, capacity, metadata } = {}) {
    return this.request(RPCCommands.UPDATE_LOBBY, {
      id: lobby.id || lobby,
      type,
      owner_id: (owner && owner.id) || owner,
      capacity,
      metadata,
    });
  };

  deleteLobby(lobby) {
    return this.request(RPCCommands.DELETE_LOBBY, {
      id: lobby.id || lobby,
    });
  };

  connectToLobby(id, secret) {
    return this.request(RPCCommands.CONNECT_TO_LOBBY, {
      id,
      secret,
    });
  };

  sendToLobby(lobby, data) {
    return this.request(RPCCommands.SEND_TO_LOBBY, {
      id: lobby.id || lobby,
      data,
    });
  };

  disconnectFromLobby(lobby) {
    return this.request(RPCCommands.DISCONNECT_FROM_LOBBY, {
      id: lobby.id || lobby,
    });
  };

  updateLobbyMember(lobby, user, metadata) {
    return this.request(RPCCommands.UPDATE_LOBBY_MEMBER, {
      lobby_id: lobby.id || lobby,
      user_id: user.id || user,
      metadata,
    });
  };

  getRelationships() {
    const types = Object.keys(RelationshipTypes);
    return this.request(RPCCommands.GET_RELATIONSHIPS)
      .then((o) => o.relationships.map((r) => ({
        ...r,
        type: types[r.type],
      })));
  };

  async subscribe(event, args) {
    await this.request(RPCCommands.SUBSCRIBE, args, event);
    return {
      unsubscribe: () => this.request(RPCCommands.UNSUBSCRIBE, args, event),
    };
  };

  safeOn(event, handler) {
    const wrapper = (...args) => {
      try {
        handler(...args);
      } catch (error) {
        this.emit('error', error);
      }
    };

    this._boundListeners.set(handler, wrapper);
    this.on(event, wrapper);

    return () => this.removeListener(event, wrapper);
  };

  async destroy() {
    this._boundListeners.clear();
    this.removeAllListeners();

    if (this.cache) this.cache.clear();
    this._expecting.clear();
    this._subscriptions.clear();

    await this.transport.close();
  };

  get transport() {
    if (!this._transport) {
      const Transport = transports;
      this._transport = new Transport(this);
    }
    return this._transport;
  }
};

module.exports = RpcClient;
module.exports.RPCScopes = RPCScopes;
module.exports.ScopePresets = ScopePresets;
module.exports.ScopeHelper = ScopeHelper;