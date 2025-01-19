import { AutocompleteInteraction, Interaction } from "discord.js";
import { SlashManager } from "../managers";

export async function autocompletehandle(interaction: AutocompleteInteraction) {
	try {
		SlashManager.getInstance().autoComplete(interaction);
	} catch (error) {
		console.error(error);
	}
}
