import {
	AutocompleteInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces";
import { SlashManager } from "../Managers/SlashManager";
import { PermManager } from "../Managers/PermManager";

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Recarga los comandos")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("El nombre del comando")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		if (!PermManager.getInstance().isDeveloper(interaction.user.id)) return;
		const slashManager = SlashManager.getInstance();
		// @ts-ignore
		const name = interaction.options.getString("name");
		slashManager.reloadCommand(name);
		await interaction.reply({
			content: "Comando recargado",
			flags: MessageFlags.Ephemeral,
		});
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		if (!PermManager.getInstance().isDeveloper(interaction.user.id)) return;
		const slashManager = SlashManager.getInstance();
		const commandNames = slashManager.getCommandNames();
		// @ts-ignore
		const escrito = interaction.options.getFocused();
		const filtered = commandNames.filter((name) =>
			// @ts-ignore
			name.startsWith(escrito)
		);
		const result = filtered.map((choice) => ({ name: choice, value: choice }));
		// @ts-ignore
		await interaction.respond(result);
	},
};
export default comando;
