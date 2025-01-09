import { ButtonInteraction } from "discord.js";
import { SlashManager } from "../managers";

export async function buttonshandle(interaction: ButtonInteraction) {
	try {
		SlashManager.getInstance().buttons(interaction);
	} catch (error) {
		console.error(error);
	}
}
