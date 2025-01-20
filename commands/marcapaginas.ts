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
		.setName("marcapaginas")
		.setDescription("Marca la página por la que vas de un libro")
		.addStringOption((option) =>
			option
				.setName("título")
				.setDescription("El nombre del libro")
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("página")
				.setDescription("La página por la que vas")
				.setRequired(true)
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
		const pagina = interactionOptions.getInteger("página");
		const validationError = validatePagina(pagina, book.Paginas);
		if (validationError) {
			await interaction.editReply({
				content: validationError,
			});
			return;
		}

		await interaction.editReply({
			content: "Página marcada con exito",
		});
		await ListManager.getInstance().markPage(
			interaction.user.id,
			titulo,
			pagina
		);
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
		} else if (focusedOption.name == "página") {
			const mapeado = [];
			setTimeout(async () => {
				if (!interaction.responded) {
					await interaction.respond(mapeado);
				}
			}, 2000);
			const book = await BookManager.getInstance().getBookByTitle(
				interactionOptions.getString("título")
			);
			if (!book && !interaction.responded) {
				await interaction.respond([]);
				return;
			}
			try {
				const marcada =
					focusedOption.value.trim().length == 0
						? 0
						: parseInt(focusedOption.value);
				for (let i = marcada; i <= book.Paginas && mapeado.length < 25; i++) {
					mapeado.push({
						name: `${i}`,
						value: i,
					});
				}
			} catch (error) {
				if (!interaction.responded) {
					await interaction.respond([]);
				}
			}
		}
	},
};
export default comando;

// Function to validate the pagina input
function validatePagina(pagina: number, totalPaginas: number): string | null {
	return isNaN(pagina) || pagina < 0 || pagina > totalPaginas
		? `Página no valida (debe ser un numero entre 1 y ${totalPaginas})`
		: null;
}
