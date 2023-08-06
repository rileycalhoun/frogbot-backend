import GuildDocument from "../types/Guild";
import mongoose, { Schema } from "mongoose";

const Guild = new Schema({
    id: String,
    name: String,
    icon: String,
    messageTime: String,
    timezone: String,
    channel: String,
    nickname: String
});

export default mongoose.model<GuildDocument>("Guild", Guild, "guilds");