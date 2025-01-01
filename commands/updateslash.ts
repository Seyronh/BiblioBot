import { MessageFlags, REST, SlashCommandBuilder, Routes } from "discord.js";
import { Command } from "../interfaces";
import { SlashManager } from "../Managers/SlashManager";
import { PermManager } from "../Managers/PermManager";

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("updateslash")
		.setDescription("actualiza las definiciones del comando")
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
		const comando = slashManager.getCommand(name);
		if (!comando) {
			await interaction.reply({
				content: "Comando no encontrado",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const data = await rest.post(
			Routes.applicationCommands("1321177048202350592"),
			{
				body: comando.data.toJSON(),
			}
		);
		await interaction.reply({
			content: "Comando agregado",
			flags: MessageFlags.Ephemeral,
		});
	},
	autoComplete: async (interaction) => {
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
