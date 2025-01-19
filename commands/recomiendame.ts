import {
	AttachmentBuilder,
	CommandInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { DBManager } from "../managers";
import { bookembed, getInputById, getInputByTitle } from "../utils";
import { AutoEncoder, Recommender } from "../ai";
import tf from "@tensorflow/tfjs-node";

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("recomiendame")
		.setDescription("Te recomienda un libro")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("similares")
				.setDescription(
					"Te recomienda libros en base a los libros que has leido"
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("inteligente")
				.setDescription(
					"(BETA) Te recomienda libros en base a los libros que has leido usando IA"
				)
		) as SlashCommandBuilder,

	execute: async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const subcommand = interactionOptions.getSubcommand();
		switch (subcommand) {
			case "similares":
				await similares(interaction);
				break;
			case "inteligente":
				await inteligente(interaction);
				break;
		}
	},
};
export default comando;

async function similares(interaction: CommandInteraction) {
	const id = interaction.user.id;
	const [leidos, leyendo, planeandoleer] = await Promise.all([
		db.getListNoOffset(id, 0),
		db.getListNoOffset(id, 1),
		db.getListNoOffset(id, 2),
	]);
	const filtroBooks = [...leidos, ...leyendo, ...planeandoleer];
	const bookInicial = await db.getBookByTitle(
		leidos[Math.floor(Math.random() * leidos.length)]
	);
	const books = await db.getSimilarBooks(bookInicial, filtroBooks);
	if (!books || books.length == 0) {
		await interaction.editReply({
			content: "Nos quedan libros por recomendarte",
		});
		return;
	}
	const book = books[Math.floor(Math.random() * books.length)];
	const imageBuffer = Buffer.from(book.Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const embed = bookembed(
		book,
		`Para mas información usa el comando /verlibro | En base a ${bookInicial.Titulo}`,
		await db.getNotaMedia(book.Titulo)
	);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
	});
}

const maximo = 10;
const limite = maximo * 100;
async function inteligente(interaction: CommandInteraction) {
	const [autoencoder, recommender] = await Promise.all([
		AutoEncoder.getInstance(),
		Recommender.getInstance(),
	]);
	const id = interaction.user.id;
	const datosEncoder = await getInputById(id);
	const encodedPromise = autoencoder.encode(datosEncoder.reshape([1, 3072]));
	const [leidos, leyendo, planeandoleer] = await Promise.all([
		db.getListNoOffset(id, 0),
		db.getListNoOffset(id, 1),
		db.getListNoOffset(id, 2),
	]);
	const filtros = [...leidos, ...leyendo, ...planeandoleer];
	let todos = await db.getAllBooks();
	todos = todos.filter((book) => !filtros.includes(book.Titulo));
	const posibles = [];
	const encoded = ((await encodedPromise) as tf.Tensor).reshape([194]);
	for (let i = 0; i < limite && posibles.length < maximo; i++) {
		const book = todos[Math.floor(Math.random() * todos.length)];
		const libro = await getInputByTitle(book.Titulo);
		const entrada = tf.concat([libro, encoded]);
		const salida = (await recommender.predict(
			entrada.reshape([1, 1218])
		)) as tf.Tensor;
		const notaPredecida = salida.arraySync()[0][0];
		if (notaPredecida > 0.5) {
			posibles.push({ libro: book, nota: notaPredecida });
		}
	}
	if (posibles.length == 0) {
		await similares(interaction);
		return;
	}
	const posiblesOrdenados = posibles.sort((a, b) => b.nota - a.nota);
	const datos = posiblesOrdenados[0];
	const book = datos.libro;
	const imageBuffer = Buffer.from(book.Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const embed = bookembed(
		book,
		`Para mas información usa el comando /verlibro | Nota predecida: ${(
			datos.nota * 10
		).toFixed(2)}`,
		await db.getNotaMedia(book.Titulo)
	);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
	});
}
