import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces";
import { PermManager } from "../Managers/PermManager";

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("resetperms")
		.setDescription("Recarga los permisos") as SlashCommandBuilder,
	execute: async (interaction) => {
		if (!PermManager.getInstance().isDeveloper(interaction.user.id)) return;
		PermManager.getInstance().resetPermissions();
		await interaction.reply({
			content: "Permisos recargados",
			flags: MessageFlags.Ephemeral,
		});
	},
};
export default comando;
