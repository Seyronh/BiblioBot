import { CommandInteraction, Interaction } from "discord.js";
import { SlashManager } from "../managers";
import { MessageFlags } from "discord.js";

export async function commandhandle(interaction: CommandInteraction) {
	try {
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
