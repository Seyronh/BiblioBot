import { StringSelectMenuOptionBuilder } from "discord.js";
import { generosDisponibles } from "../config.json";
export function createMenuGenerosOptions() {
	const options: StringSelectMenuOptionBuilder[] = [];
	for (let i = 0; i < 25; i++) {
		const genero = generosDisponibles[i];
		options.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${genero}`)
				.setValue(`${genero}`)
		);
	}
	return options;
}
export function insertTextInMiddle(text: string, middleText: string) {
	const partes = text.split("\n");
	return `${partes[0] ? partes[0] : ""}\n${middleText}\n${
		partes[2] ? partes[2] : ""
	}`;
}
export function extraerGeneros(text: String) {
	const partes = text.split("\n");
	return partes[1].split(": ")[1];
}
