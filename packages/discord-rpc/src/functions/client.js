/**
 * @author brokenedtzjs
 * @license MIT
 * @copyright brokenedtzjs
 * @file client.js
 */

'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');
const transports = require('../options/transports');
const {
  setTimeout,
  clearTimeout
} = require('timers');
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

function subKey(event, args) {
  return `${event}${JSON.stringify(args)}`;
};

class RpcClient extends EventEmitter {
  constructor() {
    super();

    this.accessToken = null;
    this.clientId = null;
    this.application = null;
    this.user = null;

    const Transport = transports['ipc'];

    this.fetch = (method, path, { data, query } = {}) =>
      fetch(`${this.fetch.endpoint}${path}${query ? new URLSearchParams(query) : ''}`, {
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

    this.fetch.endpoint = 'https://discord.com/api';
    this.transport = new Transport(this);
    this.transport.on('message', this._onRpcMessage.bind(this));
    this._expecting = new Map();
    this._connectPromise = undefined;
  };

  connect(clientId) {
    if (this._connectPromise) {
      return this._connectPromise;
    };
    this._connectPromise = new Promise((resolve, reject) => {
      this.clientId = clientId;
      const timeout = setTimeout(() => {
        reject(new RpcTimeout(errorCode.RpcTimeout));
      }, 10e3);
      timeout.unref();
      this.once('connected', () => {
        clearTimeout(timeout);
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
    await this.connect(clientId);
    if (!loginOptions.scopes) {
      this.emit('ready');
      return this;
    };
    const accessToken = await this.authorize({
      clientId,
      clientSecret,
      scopes: loginOptions.scopes,
    });
    return this.authenticate(accessToken);
  };

  request(cmd, args, evt) {
    return new Promise((resolve, reject) => {
      const nonce = uuid();
      this.transport.send({ cmd, args, evt, nonce });
      this._expecting.set(nonce, { resolve, reject });
    });
  };

  _onRpcMessage(message) {
    if (message.cmd === RPCCommands.DISPATCH && message.evt === RPCEvents.READY) {
      if (message.data.user) {
        this.user = message.data.user;
      };
      this.emit('connected');
    } else if (this._expecting.has(message.nonce)) {
      const { resolve, reject } = this._expecting.get(message.nonce);
      if (message.evt === 'RpcError') {
        const e = new RpcError(
          errorCode.MessageError,
          message.data.message
        );
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
        redirect_uri: redirectUri,
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

  getGuild(id, timeout) {
    return this.request(RPCCommands.GET_GUILD, { guild_id: id, timeout });
  };

  getGuilds(timeout) {
    return this.request(RPCCommands.GET_GUILDS, { timeout });
  };

  getChannel(id, timeout) {
    return this.request(RPCCommands.GET_CHANNEL, { channel_id: id, timeout });
  };

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
    if(args.type) {
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

  async destroy() {
    await this.transport.close();
  };
};
module.exports = RpcClient;