import { ActivityType, Client, IntentsBitField } from 'discord.js';
import { utcToZonedTime } from 'date-fns-tz';
import Guilds from './models/Guild';
import * as mongo from './mongo';

const { BOT_TOKEN, BOT_ID, DASHBOARD_URI } = process.env;

mongo.connect();
const client = new Client({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages]
});

async function checkEnvironment() {
    if(!BOT_TOKEN) {
        console.log('No bot token provided!');
        process.exit(0);
    }
    
    if(!BOT_ID) {
        console.log('No bot ID provided!');
        process.exit(0);
    }
}

async function updateBotStatus() {
    const guildCount = client.guilds.cache.size;
    client.user?.setPresence({
        status: 'online',
        activities: [{
            name: `${guildCount} servers`,
            type: ActivityType.Watching,
            url: `${DASHBOARD_URI}`
        }]
    })
}

async function syncDatabaseSettings() {
    const allGuilds = await Guilds.find({});
    allGuilds.forEach(guild => {
        const nickname = guild.nickname;
        let self = client.guilds.cache.get(guild.id)
                ?.members.cache.get(BOT_ID as string);
        self?.setNickname(nickname as string);
    });
}

async function sendGuildMessages() {
    const allGuilds = await Guilds.find({});
    allGuilds.forEach(guild => {
        const currentTime = new Date()
            .toLocaleTimeString('en-US', {
                timeZone: guild.timezone as string,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

        const currentGuild = client.guilds.cache.get(guild.id);
        if (!currentGuild) {
            guild.deleteOne();
            return;
        }

        if (currentTime !== guild.messageTime) return;

        const channel = currentGuild.channels.cache.get(guild.channel as string);
        
        if (!channel) {
            return;
        }

        if (!channel.isTextBased()) {
            return;
        }

        const zonedData = utcToZonedTime(new Date(), guild.timezone as string);
        const day = zonedData.getDay();
        if(day === 0) return;

        channel.send({
            files: [
                `./images/${day}.png`
            ]
        });
    });
}

client.on('guildAvailable', (guild) => mongo.createIfAbsent(guild));
client.on('guildCreate', (guild) => mongo.createIfAbsent(guild));
client.on('ready', onReady);

function onReady() {
    setInterval(syncDatabaseSettings, 10_000);
    setInterval(sendGuildMessages, 60_000);
    setInterval(updateBotStatus, 60_000);

    console.log(`Shard ${client.shard?.ids} is ready!`);
}

async function start() {
    await checkEnvironment();
    await client.login(BOT_TOKEN);
}

start();