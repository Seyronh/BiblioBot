import { Interaction, StringSelectMenuInteraction } from "discord.js";
import { SlashManager } from "../managers";

export async function selectmenuhandle(
	interaction: StringSelectMenuInteraction
) {
	try {
		SlashManager.getInstance().selectMenu(interaction);
	} catch (error) {
		console.error(error);
	}
}
