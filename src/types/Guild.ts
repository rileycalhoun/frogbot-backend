import { Document } from 'mongoose';

export default interface GuildType extends Document {
    id: String,
    name: String,
    icon: String,
    messageTime: String,
    timezone: String,
    channel: String,
    nickname: String
}