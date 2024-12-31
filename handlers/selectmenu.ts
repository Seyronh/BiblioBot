import { Interaction } from "discord.js";
import { SlashManager } from "../Managers/SlashManager.js";
import { MessageFlags } from "discord.js";

export async function selectmenuhandle(interaction: Interaction) {
	try {
		// @ts-ignore
		SlashManager.getInstance().selectMenu(interaction);
	} catch (error) {
		console.error(error);
	}
}
