import dotenv from 'dotenv';
dotenv.config();

import { ShardingManager } from 'discord.js';
const { BOT_TOKEN } = process.env;

const manager = new ShardingManager('./src/bot.js', {
    respawn: true,
    token: BOT_TOKEN,
    totalShards: 'auto'
});

manager.on('shardCreate', shard => {

    shard.on('spawn', () => console.log(`${shard.id} spawned!`));
    shard.on('death', () => console.log(`${shard.id} died!`));
    shard.on('ready', () => console.log(`${shard.id} ready!`));
    shard.on('disconnect', () => console.log(`${shard.id} disconnected!`));
    shard.on('reconnecting', () => console.log(`${shard.id} reconnecting!`));
    shard.on('error', () => console.log(`${shard.id} error!`));

});

(async () => {
    manager.spawn();
})();

process.on('SIGTERM', async () => {
    manager.shards.forEach(shard => shard.kill());
    process.exit(0);
});