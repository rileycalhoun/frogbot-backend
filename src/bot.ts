import { Client, IntentsBitField } from 'discord.js';
import Guilds from './models/Guild';
import { utcToZonedTime } from 'date-fns-tz';
import * as mongo from './mongo';

const { BOT_TOKEN, BOT_ID } = process.env;

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

const sendMessages = async () => {
    const allGuilds = await Guilds.find({});
    allGuilds.forEach(guild => {
        const nickname = guild.nickname;
        let self = client.guilds.cache.get(guild.id)
                ?.members.cache.get(BOT_ID);
        self?.setNickname(nickname as string);

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
    console.log('Bot is ready!');
    setInterval(async () => sendMessages(), 10000);
});