import { Client, GatewayIntentBits } from "discord.js";
import path from "path";
import fs from "fs";
import { SlashManager, BookEventManager } from "./managers";

class DiscordBot {
	private client: Client;
	static instance: DiscordBot;
	static getInstance() {
		if (!DiscordBot.instance) {
			DiscordBot.instance = new DiscordBot();
		}
		return DiscordBot.instance;
	}
	private constructor() {
		this.createClient();
		this.loadEvents();
		this.prepareManagers();
		this.login();
	}
	private createClient() {
		this.client = new Client({
			intents: [
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.DirectMessages,
			],
		});
	}
	private loadEvents() {
		const eventsPath = path.join(__dirname, "events");
		const eventFiles = fs
			.readdirSync(eventsPath)
			.filter((file) => file.endsWith(".ts"));

		for (const file of eventFiles) {
			const filePath = path.join(eventsPath, file);
			const event = require(filePath).default;
			if (event.once) {
				this.client.once(event.name, (...args) => event.execute(...args));
			} else {
				this.client.on(event.name, (...args) => event.execute(...args));
			}
		}
	}
	private prepareManagers() {
		SlashManager.getInstance();
		BookEventManager.getInstance().setClient(this.client); //Iniciamos los managers
	}
	private login() {
		this.client.login(process.env.DISCORD_TOKEN);
	}
	public getClient() {
		return this.client;
	}
}
DiscordBot.getInstance();

export { DiscordBot };
