import { ActivityType, Client, IntentsBitField } from 'discord.js';
import { utcToZonedTime } from 'date-fns-tz';
import Guilds from './models/Guild';
import * as mongo from './mongo';

const { BOT_TOKEN, BOT_ID, DASHBOARD_URI } = process.env;

if(!BOT_TOKEN) {
    console.log('No bot token provided!');
    process.exit(0);
}

if(!BOT_ID) {
    console.log('No bot ID provided!');
    process.exit(0);
}



const client = new Client({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages]
});

const setStatus = async () => {
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

const checkNicknames = async () => {
    const allGuilds = await Guilds.find({});
    allGuilds.forEach(guild => {
        const nickname = guild.nickname;
        let self = client.guilds.cache.get(guild.id)
                ?.members.cache.get(BOT_ID);
        self?.setNickname(nickname as string);
    });
}

const sendMessages = async () => {
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
        if (!channel) return;
        if (!channel.isTextBased()) return;

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

mongo.connect();
client.login(BOT_TOKEN);

client.on('guildAvailable', guild => mongo.createIfAbsent(guild));
client.on('guildCreate', guild => mongo.createIfAbsent(guild));

client.on('ready', () => {
    setInterval(async () => sendMessages(), 60000);
    setInterval(async () => checkNicknames(), 10000);
    setInterval(async () => setStatus(), 60000);

    console.log('Bot is ready!');
});