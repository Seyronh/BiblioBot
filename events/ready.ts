import { Events } from "discord.js";
import { Event } from "../types";
const event: Event = {
	name: Events.ClientReady,
	once: true,
	async execute() {
		console.log(`Conectado a discord`);
	},
};
export default event;
