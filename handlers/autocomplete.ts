import { Interaction } from "discord.js";
import { SlashManager } from "../managers";

export async function autocompletehandle(interaction: Interaction) {
	try {
		// @ts-ignore
		SlashManager.getInstance().autoComplete(interaction);
	} catch (error) {
		console.error(error);
	}
}
