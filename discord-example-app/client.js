import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({
	intents: [
        GatewayIntentBits.Guilds,
        //GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
});

client.login(process.env.BOT_TOKEN);
export default client;