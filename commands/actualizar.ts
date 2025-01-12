import { SlashCommandBuilder } from "discord.js";
import { Command } from "../types";

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
				)
		) as SlashCommandBuilder,
	execute: async (interaction) => {},
};
export default comando;
