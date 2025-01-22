import { Client, GatewayIntentBits } from "discord.js";
import { SlashManager, BookEventManager } from "./managers";
import events from "./events";
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
		for (const eventName of Object.keys(events)) {
			const event = events[eventName];
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
