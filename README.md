<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/dc-rpc" target="_blank" rel="noopener noreferrer"><img src="https://nodei.co/npm/dc-rpc.png?downloads=true&downloadRank=true&stars=true" /></a>
  </p>
  <p>
    <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer"><img alt="node-current" src="https://img.shields.io/node/v/dc-rpc" /></a>
    <a href="https://www.npmjs.com/package/dc-rpc" target="_blank" rel="noopener noreferrer"><img alt="npm" src="https://img.shields.io/npm/dt/dc-rpc" /></a>
    <a href="https://www.npmjs.com/package/dc-rpc" target="_blank" rel="noopener noreferrer"><img alt="npm latest" src="https://img.shields.io/npm/v/dc-rpc/latest?color=blue&label=dc-rpc%40latest&logo=npm" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc" target="_blank" rel="noopener noreferrer"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/strivo-dev/discord-rpc" /></a>
    <a href="https://discord.gg/qpT2AeYZRN" target="_blank" rel="noopener noreferrer"><img alt="Discord" src="https://img.shields.io/discord/887650006977347594?label=EterNomm&logo=discord" /></a>
    <a href="https://discord.cyrateam.xyz" target="_blank" rel="noopener noreferrer"><img alt="Discord" src="https://img.shields.io/discord/984857299858382908?style=flat&logo=discord&logoColor=white&label=SITCommunity" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc" target="_blank" rel="noopener noreferrer"><img alt="Visitor" src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FCyraTeam%2Fdiscord-rpc&countColor=%2337d67a&style=flat" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc/issues" target="_blank" rel="noopener noreferrer"><img alt="Issues" src="https://img.shields.io/github/issues/strivo-dev/discord-rpc" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc" target="_blank" rel="noopener noreferrer"><img alt="Commit" src="https://img.shields.io/github/commit-activity/y/strivo-dev/discord-rpc?label=Commit%20Activity&logo=github" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc/actions/workflows/test.yml"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/strivo-dev/discord-rpc/.github%2Fworkflows%2Ftest.yml" /></a>
    <a href="https://github.com/strivo-dev/discord-rpc/blob/main/LICENSE"><img alt="Build" src="https://img.shields.io/npm/l/dc-rpc" /></a>
  </p>
</div>

# Discord RPC

- **[discord-rpc] is a powerful library created by Discord, allowing developers to integrate Rich Presence functionality into their Discord applications smoothly.**

> [!NOTE]
> This Discord RPC is a remake of the original [discord-rpc] created by Discord.js, also known as Discord.

## Installation

```
npm install dc-rpc
pnpm install dc-rpc
```

## Quick example

```js
// Importing Discord-RPC
const { RpcClient } = require('dc-rpc');

// Create an instance of Discord-RPC
const client = new RpcClient();

// ================================================================

// Your Applications Client ID
const Id = 'client_id';

// Login To Discord RPC
await client.login({ clientId: Id });

// ================================================================

// Function When Client Is Ready
client.on('ready', () => {
	console.log('Authed for user:', client.user.username); // Console Output: Authed for user: [discord_username]

	// Set Activity (Example)
	client.setActivity({
		state: 'it work!!!',
		details: 'Testing RPC',
		largeImageKey: 'icon_name', // From Discord Applications Rich Presence Assets
		largeImageText: 'this is icon',
		startTimestamp: Date.now(),
	});
});

// ================================================================

// Destroying Or Disconnecting From RPC
client.destroy();
```

## Example Results

![presence](https://github.com/user-attachments/assets/a53e95ff-e9e5-4b86-8c52-7935cd23d469)

## License

```
This Project under MIT License
© 2019 - 2024 Strivo Development. All Rights Reserved
```

[discord-rpc]: https://github.com/discordjs/RPC