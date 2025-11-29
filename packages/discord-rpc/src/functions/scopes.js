/**
 * @author nokarin-dev
 * @license MIT
 * @copyright nokarin-dev
 * @file scopes.js
 */

'use strict';

const { errorCode } = require("../error");

/**
 * Discord RPC OAuth2 Scopes
 * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 */
const RPCScopes = Object.freeze({
    // Basic scopes
    IDENTIFY: 'identify',
    EMAIL: 'email',
    CONNECTIONS: 'connections',
    GUILDS: 'guilds',
    GUILDS_JOIN: 'guilds.join',
    GUILDS_MEMBERS_READ: 'guilds.members.read',

    // Activity scopes
    RPC: 'rpc',
    RPC_NOTIFICATIONS_READ: 'rpc.notifications.read',
    RPC_VOICE_READ: 'rpc.voice.read',
    RPC_VOICE_WRITE: 'rpc.voice.write',
    RPC_ACTIVITIES_WRITE: 'rpc.activities.write',

    // Message scopes
    MESSAGES_READ: 'messages.read',

    // Application scopes
    APPLICATIONS_BUILDS_UPLOAD: 'applications.builds.upload',
    APPLICATIONS_BUILDS_READ: 'applications.builds.read',
    APPLICATIONS_COMMANDS: 'applications.commands',
    APPLICATIONS_COMMANDS_UPDATE: 'applications.commands.update',
    APPLICATIONS_COMMANDS_PERMISSIONS_UPDATE: 'applications.commands.permissions.update',
    APPLICATIONS_STORE_UPDATE: 'applications.store.update',
    APPLICATIONS_ENTITLEMENTS: 'applications.entitlements',

    // Other scopes
    BOT: 'bot',
    WEBHOOK_INCOMING: 'webhook.incoming',
    RELATIONSHIPS_READ: 'relationships.read',
    ACTIVITIES_READ: 'activities.read',
    ACTIVITIES_WRITE: 'activities.write',
    ROLE_CONNECTIONS_WRITE: 'role_connections.write',
    VOICE: 'voice',
    GDM_JOIN: 'gdm.join',
});

/**
 * Preset scope combinations for common use cases
 */
const ScopePresets = Object.freeze({
    BASIC: Object.freeze([
        RPCScopes.IDENTIFY,
    ]),

    RICH_PRESENCE: Object.freeze([
        RPCScopes.RPC,
        RPCScopes.RPC_ACTIVITIES_WRITE,
    ]),

    VOICE_CONTROL: Object.freeze([
        RPCScopes.RPC,
        RPCScopes.RPC_VOICE_READ,
        RPCScopes.RPC_VOICE_WRITE,
    ]),

    FULL_RPC: Object.freeze([
        RPCScopes.RPC,
        RPCScopes.RPC_NOTIFICATIONS_READ,
        RPCScopes.RPC_VOICE_READ,
        RPCScopes.RPC_VOICE_WRITE,
        RPCScopes.RPC_ACTIVITIES_WRITE,
        RPCScopes.MESSAGES_READ,
    ]),

    GUILD_ACCESS: Object.freeze([
        RPCScopes.GUILDS,
        RPCScopes.GUILDS_MEMBERS_READ,
    ]),

    USER_PROFILE: Object.freeze([
        RPCScopes.IDENTIFY,
        RPCScopes.EMAIL,
        RPCScopes.CONNECTIONS,
    ]),
});

/**
 * Scope validator and helper
 */
class ScopeHelper {
    static isValid(scope) {
        if (!this._validScopes) {
            this._validScopes = new Set(Object.values(RPCScopes));
        }

        return Object.values(RPCScopes).includes(scope);
    }

    static validateScopes(scopes) {
        if (!Array.isArray(scopes)) {
            return { valid: false, invalid: ['scopes must be an array'] };
        }

        const invalid = scopes.filter(s => !this.isValid(s));
        return {
            valid: invalid.length === 0,
            invalid,
        };
    }

    static getPreset(presetName) {
        const upperName = presetName.toUpperCase();
        const preset = ScopePresets[upperName];

        if (!preset) {
            const available = Object.keys(ScopePresets).join(', ');
            throw new RpcError(errorCode.UnknownPresets, presetName, available);
        }

        return [...preset];
    }

    static merge(...scopeArrays) {
        return [...new Set(scopeArrays.flat())];
    }

    /**
     * Get description of a scope
     * @param {string} scope - Scope name
     * @returns {string}
     */
    static describe(scope) {
        const descriptions = {
            [RPCScopes.IDENTIFY]: 'Access to basic user info (username, avatar, discriminator)',
            [RPCScopes.EMAIL]: 'Access to user email address',
            [RPCScopes.CONNECTIONS]: 'Access to linked third-party accounts',
            [RPCScopes.GUILDS]: 'Access to guilds user is in',
            [RPCScopes.GUILDS_JOIN]: 'Join guilds on behalf of user',
            [RPCScopes.GUILDS_MEMBERS_READ]: 'Read guild members',
            [RPCScopes.RPC]: 'Control local Discord client via RPC',
            [RPCScopes.RPC_NOTIFICATIONS_READ]: 'Read notifications',
            [RPCScopes.RPC_VOICE_READ]: 'Read voice settings',
            [RPCScopes.RPC_VOICE_WRITE]: 'Control voice settings',
            [RPCScopes.RPC_ACTIVITIES_WRITE]: 'Update user activity/Rich Presence',
            [RPCScopes.MESSAGES_READ]: 'Read messages',
            [RPCScopes.RELATIONSHIPS_READ]: 'Read relationships (friends, blocked)',
            [RPCScopes.ACTIVITIES_READ]: 'Read activities',
            [RPCScopes.ACTIVITIES_WRITE]: 'Write activities',
            [RPCScopes.VOICE]: 'Join voice channels',
        };
        return descriptions[scope] || 'No description available';
    }

    /**
     * Print all available scopes with descriptions
     */
    static listAll() {
        console.log('📋 Available Discord RPC Scopes:\n');
        Object.entries(RPCScopes).forEach(([key, value]) => {
            console.log(`  ${key.padEnd(40)} → ${value}`);
            console.log(`     ${this.describe(value)}\n`);
        });
    }

    /**
     * Print all presets
     */
    static listPresets() {
        console.log('🎯 Scope Presets:\n');
        Object.entries(ScopePresets).forEach(([name, scopes]) => {
            console.log(`  ${name}:`);
            scopes.forEach(scope => console.log(`    - ${scope}`));
            console.log('');
        });
    }
}

module.exports = {
    RPCScopes,
    ScopePresets,
    ScopeHelper,
};