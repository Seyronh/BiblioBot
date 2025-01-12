import {
	AutocompleteInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { DBManager } from "../managers";

const db = DBManager.getInstance();
const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("actualizar")
		.setDescription("Actualizar información de un libro")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("titulo")
				.setDescription("Actualizar el titulo de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
						.setName("nuevotitulo")
						.setDescription("El nuevo titulo del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("imagen")
				.setDescription("Actualizar la imagen de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addAttachmentOption((option) =>
					option
						.setName("nuevaimagen")
						.setDescription("La nueva imagen del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("autor")
				.setDescription("Actualizar el autor de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
						.setName("nuevoautor")
						.setDescription("El nuevo autor del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("sinopsis")
				.setDescription("Actualizar la sinopsis de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
						.setName("nuevasinopsis")
						.setDescription("La nueva sinopsis del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("paginas")
				.setDescription("Actualizar el numero de paginas de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addIntegerOption((option) =>
					option
						.setName("nuevaspaginas")
						.setDescription("El nuevo numero de paginas del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("generos")
				.setDescription("Actualizar los generos de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const subcommand = interactionOptions.getSubcommand();
		const titulo = interactionOptions.getString("titulo");
		const book = await db.getBookByTitle(titulo);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		if (subcommand == "titulo") {
			await cambiarTitulo(interaction, titulo);
		}
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const candidatos = await db.getBooksNameAutocomplete(
			interactionOptions.getFocused(),
			true
		);
		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato,
		}));
		await interaction.respond(mapeado);
	},
};
export default comando;

async function cambiarTitulo(interaction: CommandInteraction, titulo: string) {
	const interactionOptions =
		interaction.options as CommandInteractionOptionResolver;
	const nuevotitulo = interactionOptions.getString("nuevotitulo");
	if (!nuevotitulo && nuevotitulo.trim().length == 0) {
		await interaction.editReply({
			content: `El nuevo titulo no puede ser vacio`,
		});
		return;
	}
	const book = await db.getBookByTitle(nuevotitulo);
	if (book) {
		await interaction.editReply({
			content: `Ya existe un libro con el nuevo titulo.`,
		});
		return;
	}
	await db.updateBookTitle(titulo, nuevotitulo);
	await interaction.editReply({
		content: `Titulo actualizado con exito`,
	});
}
