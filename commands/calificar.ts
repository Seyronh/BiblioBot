import {
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { BookManager, ListManager } from "../managers";

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("calificar")
		.setDescription("Pones una nota a un libro")
		.addStringOption((option) =>
			option
				.setName("título")
				.setDescription("El nombre del libro")
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("nota")
				.setDescription("La nota que le das al libro")
				.setRequired(false)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const titulo = interactionOptions.getString("título");
		const book = await BookManager.getInstance().getBookByTitle(titulo);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		if (
			!(await ListManager.getInstance().existsList(
				interaction.user.id,
				book.Titulo
			))
		) {
			await interaction.editReply({
				content: "Libro no encontrado en ninguna lista",
			});
			return;
		}

		const nota = interactionOptions.getInteger("nota");
		if (
			!nota &&
			(
				await ListManager.getInstance().getUserBookInfo(
					interaction.user.id,
					titulo
				)
			).Nota != -1
		) {
			await ListManager.getInstance().deleteNota(interaction.user.id, titulo);
			await interaction.editReply({
				content: "Nota borrada con exito",
			});
			return;
		}
		const validationError = validateNota(nota);
		if (validationError) {
			await interaction.editReply({
				content: validationError,
			});
			return;
		}
		await interaction.editReply({
			content: "Nota puesta con exito",
		});
		await ListManager.getInstance().setNota(interaction.user.id, titulo, nota);
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const focusedOption = interactionOptions.getFocused(true);
		if (focusedOption.name == "título") {
			const candidatos =
				await BookManager.getInstance().getBooksNameAutocomplete(
					focusedOption.value,
					true
				);
			const mapeado = candidatos.map((candidato) => ({
				name: candidato,
				value: candidato,
			}));

			await interaction.respond(mapeado);
		} else if (focusedOption.name == "nota") {
			await interaction.respond([
				{
					name: "0",
					value: 0,
				},
				{
					name: "1",
					value: 1,
				},
				{
					name: "2",
					value: 2,
				},
				{
					name: "3",
					value: 3,
				},
				{
					name: "4",
					value: 4,
				},
				{
					name: "5",
					value: 5,
				},
				{
					name: "6",
					value: 6,
				},
				{
					name: "7",
					value: 7,
				},
				{
					name: "8",
					value: 8,
				},
				{
					name: "9",
					value: 9,
				},
				{
					name: "10",
					value: 10,
				},
			]);
		}
	},
};
export default comando;

// Function to validate the nota input
function validateNota(nota: number): string | null {
	if (isNaN(nota)) {
		return "Nota no valida";
	}
	if (nota < 0) {
		return "Nota no valida debe ser un numero positivo";
	}
	if (nota > 10) {
		return "Nota no valida debe ser menor o igual que 10";
	}
	return null;
}
