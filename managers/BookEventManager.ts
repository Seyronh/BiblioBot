import { AttachmentBuilder, Client } from "discord.js";
import { Book } from "../types";
import { canal_eventolibros } from "../config.json";
import { bookembed } from "../utils";

export class BookEventManager {
	private static instance: BookEventManager;
	private client;
	private stagedEvents = [];
	public static getInstance(): BookEventManager {
		if (!BookEventManager.instance) {
			BookEventManager.instance = new BookEventManager();
		}
		return BookEventManager.instance;
	}
	setClient(client: Client) {
		this.client = client;
	}
	eventBook(book: Book, message: string) {
		this.stagedEvents.push({
			book: book,
			message: message,
		});
		if (!this.client) return;
		this.ConsumeStaged();
	}
	private ConsumeStaged() {
		let eventos = [...this.stagedEvents];
		this.stagedEvents = [];
		for (const evento of eventos) {
			const channel = this.client.channels.cache.get(canal_eventolibros);
			if (channel) {
				const imageBuffer = Buffer.from(evento.book.Imagen);
				const attachment = new AttachmentBuilder(imageBuffer, {
					name: `imagen.jpg`,
				});
				channel.send({
					content: evento.message,
					embeds: [
						bookembed(
							evento.book,
							"Puedes buscar mas informacion sobre este libro con el comando /verlibro"
						),
					],
					files: [attachment],
				});
			}
		}
	}
}
