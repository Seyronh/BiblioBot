import { Interaction } from "discord.js";
import { SlashManager } from "../Managers/SlashManager.js";
import { MessageFlags } from "discord.js";

export async function commandhandle(interaction: Interaction) {
	try {
		// @ts-ignore
		SlashManager.getInstance().execute(interaction);
	} catch (error) {
		console.error(error);
		// @ts-ignore
		await interaction.reply({
			content: "Error al ejecutar el comando",
			flags: MessageFlags.Ephemeral,
		});
	}
}
