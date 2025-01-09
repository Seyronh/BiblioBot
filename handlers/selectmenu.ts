import { Interaction } from "discord.js";
import { SlashManager } from "../managers";

export async function selectmenuhandle(interaction: Interaction) {
	try {
		// @ts-ignore
		SlashManager.getInstance().selectMenu(interaction);
	} catch (error) {
		console.error(error);
	}
}
