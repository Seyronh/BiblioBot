import config from "./config.json";
import { autocompletehandle } from "./handlers/autocomplete";
import { buttonshandle } from "./handlers/buttons";
import { commandhandle } from "./handlers/command";
import { Client, GatewayIntentBits, Interaction } from "discord.js";
import { modalhandle } from "./handlers/modal";
import { EmbeddingManager } from "./Managers/EmbeddingManager";
import { DBManager } from "./Managers/DBManager";
import { BookEventManager } from "./Managers/BookEventManager";
import { selectmenuhandle } from "./handlers/selectmenu";

EmbeddingManager.getInstance();
DBManager.getInstance();

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
	if (interaction.isModalSubmit()) modalhandle(interaction);
	if (interaction.isStringSelectMenu()) selectmenuhandle(interaction);
});

client.login(process.env.DISCORD_TOKEN);
