import { BookEventManager, DBManager, SlashManager } from "../managers";
import { Events } from "discord.js";
import { Event } from "../types";
const event: Event = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		SlashManager.getInstance();
		DBManager.getInstance();
		BookEventManager.getInstance().setClient(client); //Iniciamos los managers
		console.log(`Logged in as ${client.user?.tag}!`);
	},
};
export default event;
