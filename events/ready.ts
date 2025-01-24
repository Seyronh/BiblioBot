import { Events, TextChannel } from "discord.js";
import { Event } from "../types";
import { canal_eventoreinicios } from "../config.json";
const event: Event = {
	name: Events.ClientReady,
	once: true,
	async execute(cliente) {
		console.log(`Conectado a discord`);
		const Channel: TextChannel = await cliente.channels.fetch(
			canal_eventoreinicios
		);
		if (Channel) {
			Channel.send(`conectado <t:${Math.floor(Date.now() / 1000)}:F>`);
		}
	},
};
export default event;
