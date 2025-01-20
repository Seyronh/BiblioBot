import {
	AttachmentBuilder,
	CommandInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { bookembed, getInputById, getInputByTitle } from "../utils";
import { AutoEncoder, Recommender } from "../ai";
import tf from "@tensorflow/tfjs-node";
import { BookManager, ListManager } from "../managers";

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
		ListManager.getInstance().getList(id, 0),
		ListManager.getInstance().getList(id, 1),
		ListManager.getInstance().getList(id, 2),
	]);
	const filtroBooks = [...leidos, ...leyendo, ...planeandoleer];
	let buscar = leidos;
	if (buscar.length == 0) buscar = leyendo;
	if (buscar.length == 0) buscar = planeandoleer;
	if (buscar.length == 0) {
		await interaction.editReply({
			content: "No has leido ningun libro y no podemos sugerirte similares",
		});
		return;
	}
	const bookInicial = await BookManager.getInstance().getBookByTitle(
		buscar[Math.floor(Math.random() * buscar.length)]
	);
	const books = await BookManager.getInstance().getSimilarBooks(
		bookInicial,
		filtroBooks
	);
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
		await ListManager.getInstance().getNotaMedia(book.Titulo)
	);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
	});
}

async function inteligente(interaction: CommandInteraction) {
	const [autoencoder, recommender] = await Promise.all([
		AutoEncoder.getInstance(),
		Recommender.getInstance(),
	]);
	const id = interaction.user.id;
	const datosEncoder = await getInputById(id);
	const reshapedDatos = datosEncoder.reshape([1, 3072]);
	const encodedPromise = autoencoder.encode(reshapedDatos);
	datosEncoder.dispose();
	const [leidos, leyendo, planeandoleer] = await Promise.all([
		ListManager.getInstance().getList(id, 0),
		ListManager.getInstance().getList(id, 1),
		ListManager.getInstance().getList(id, 2),
	]);
	const filtros = [...leidos, ...leyendo, ...planeandoleer];
	let todos = await BookManager.getInstance().getAllBooks();
	todos = todos.filter((book) => !filtros.includes(book));
	const posibles = [];
	const encoded = ((await encodedPromise) as tf.Tensor).reshape([194]);
	reshapedDatos.dispose();
	for (const book of todos) {
		const libro = await getInputByTitle(book);
		const entrada = tf.concat([libro, encoded]);
		const reshapedEntrada = entrada.reshape([1, 1218]);
		const salida = (await recommender.predict(reshapedEntrada)) as tf.Tensor;
		const notaPredecida = salida.dataSync()[0];
		salida.dispose();
		reshapedEntrada.dispose();
		entrada.dispose();
		libro.dispose();
		posibles.push({ libro: book, nota: notaPredecida });
	}
	encoded.dispose();
	if (posibles.length == 0) {
		await similares(interaction);
		return;
	}
	const posiblesOrdenados = posibles.sort((a, b) => b.nota - a.nota);
	const datos = posiblesOrdenados[0];
	const book = await BookManager.getInstance().getBookByTitle(datos.libro);
	const imageBuffer = Buffer.from(book.Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const embed = bookembed(
		book,
		`Para mas información usa el comando /verlibro | Nota predecida: ${(
			datos.nota * 10
		).toFixed(2)}`,
		await ListManager.getInstance().getNotaMedia(book.Titulo)
	);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
	});
}
