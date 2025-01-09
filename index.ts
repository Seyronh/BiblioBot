import { Client, GatewayIntentBits } from "discord.js";
import path from "path";
import fs from "fs";

class DiscordBot {
	private client: Client;
	constructor() {
		this.createClient();
		this.loadEvents();
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
	private login() {
		this.client.login(process.env.DISCORD_TOKEN);
	}
}
const bot = new DiscordBot();
