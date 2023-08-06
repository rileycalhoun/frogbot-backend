import mongoose from 'mongoose';
import Guilds from './models/Guild';
import GuildDocument from './types/Guild';
import { ChannelType, Guild as DiscordGuild } from 'discord.js';
const { MONGO_URI } = process.env;

var isConnected = 0;

export const connect = async () => {
    if(isConnected === 1) {
        console.log('Using existing database connection');
        return;
    }

    if(mongoose.connections.length > 0) {
        isConnected = mongoose.connections[0].readyState;
        if(isConnected === 1) {
            console.log("Using existing database connection");
            return;
        }

        await mongoose.disconnect();
    }

    await mongoose.connect(MONGO_URI ?? '');
    isConnected = 1;
    console.log("New database connection established");
};

export const disconnect = async () => {
    if(process.env.NODE_ENV === 'development') return;
    if(isConnected === 0) return;

    await mongoose.disconnect();
    isConnected = 0;
    console.log('Database connection terminated');
};

export const createIfAbsent = async (guild: DiscordGuild) => {
    let exists = await Guilds.exists({ id: guild.id});
    if(exists) return;

    const newGuild = new Guilds({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        messageTime: '00:00',
        timezone: 'UTC',
        channel: '',
        nickname: ''
    });

    await newGuild.save();
}

export const findGuild = async (id: string) => {
    let guild = await Guilds.findOne({ id });
    return guild;
}

export const updateGuild = async (id: string, updatedGuild: GuildDocument) => {
    await Guilds.findOneAndUpdate({
        id
    }, updatedGuild).exec();
}