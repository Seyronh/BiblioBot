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
		if (interaction.isCommand()) commandhandle(interaction);
		if (interaction.isAutocomplete()) autocompletehandle(interaction);
		if (interaction.isButton()) buttonshandle(interaction);
		if (interaction.isStringSelectMenu()) selectmenuhandle(interaction);
	},
};
export default event;
