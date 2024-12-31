import { ButtonInteraction } from "discord.js";
import { SlashManager } from "../Managers/SlashManager";

export async function buttonshandle(interaction: ButtonInteraction) {
	try {
		SlashManager.getInstance().buttons(interaction);
	} catch (error) {
		console.error(error);
	}
}
