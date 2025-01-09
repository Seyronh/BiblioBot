import { Events } from "discord.js";
import {
	commandhandle,
	autocompletehandle,
	buttonshandle,
	selectmenuhandle,
} from "../handlers";
import { Event } from "../types";

const event: Event = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isCommand()) {
			commandhandle(interaction);
			return;
		}
		if (interaction.isAutocomplete()) {
			autocompletehandle(interaction);
			return;
		}
		if (interaction.isButton()) {
			buttonshandle(interaction);
			return;
		}
		if (interaction.isStringSelectMenu()) {
			selectmenuhandle(interaction);
			return;
		}
	},
};
export default event;
