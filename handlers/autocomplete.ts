import { Interaction } from "discord.js";
import { SlashManager } from "../Managers/SlashManager.js";

export async function autocompletehandle(interaction: Interaction) {
	try {
		// @ts-ignore
		SlashManager.getInstance().autoComplete(interaction);
	} catch (error) {
		console.error(error);
	}
}
