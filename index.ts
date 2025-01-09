import { Client, GatewayIntentBits, Interaction } from "discord.js";

import {
	selectmenuhandle,
	commandhandle,
	buttonshandle,
	autocompletehandle,
} from "./handlers";
import { DBManager, BookEventManager } from "./managers";
DBManager.getInstance(); //Init DBs

const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
	],
});

client.on("ready", () => {
	BookEventManager.getInstance().setClient(client);
	console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
	if (interaction.isCommand()) commandhandle(interaction);
	if (interaction.isAutocomplete()) autocompletehandle(interaction);
	if (interaction.isButton()) buttonshandle(interaction);
	if (interaction.isStringSelectMenu()) selectmenuhandle(interaction);
});

client.login(process.env.DISCORD_TOKEN);
