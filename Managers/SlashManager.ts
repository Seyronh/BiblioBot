import {
	CommandInteraction,
	Collection,
	AutocompleteInteraction,
	ButtonInteraction,
	StringSelectMenuInteraction,
} from "discord.js";

import fs from "fs";
import path from "path";
import { Command } from "../interfaces.js";

const commandsPath = path.join(__dirname, "..", "commands");

export class SlashManager {
	private static instance: SlashManager;
	private commands: Collection<string, Command> = new Collection();

	public static getInstance(): SlashManager {
		if (!SlashManager.instance) {
			SlashManager.instance = new SlashManager();
		}
		return SlashManager.instance;
	}
	private constructor() {
		this.loadCommands();
	}
	public getCommandsJSON() {
		return this.commands.map((command) => command.data.toJSON());
	}
	public execute(interaction: CommandInteraction) {
		const command = this.getCommand(interaction.commandName);
		if (!command) return;
		try {
			command.execute(interaction);
		} catch (error) {
			console.error(error);
		}
	}
	public autoComplete(interaction: AutocompleteInteraction) {
		const command = this.getCommand(interaction.commandName);
		if (!command) return;
		try {
			command.autoComplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
	public buttons(interaction: ButtonInteraction) {
		const partes = interaction.customId.split("|");
		const command = this.getCommand(partes[0]);
		interaction.customId = partes.slice(1).join("|");
		if (!command) return;
		try {
			command.buttons(interaction);
		} catch (error) {
			console.error(error);
		}
	}
	public selectMenu(interaction: StringSelectMenuInteraction) {
		const partes = interaction.customId.split("|");
		const command = this.getCommand(partes[0]);
		interaction.customId = partes.slice(1).join("|");
		if (!command) return;
		try {
			command.selectMenu(interaction);
		} catch (error) {
			console.error(error);
		}
	}
	public getCommandNames(): string[] {
		return this.commands.map((command) => command.data.name);
	}
	public getCommand(name: string): Command | undefined {
		return this.commands.get(name);
	}
	public reloadCommand(name: string) {
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter((file) => file == `${name}.ts`);
		for (const file of commandFiles) {
			delete require.cache[require.resolve(path.join(commandsPath, file))];
			const command = require(path.join(commandsPath, file)).default;
			this.commands.set(command.data.name, command);
		}
	}
	private loadCommands() {
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter((file) => file.endsWith(".ts"));
		for (const file of commandFiles) {
			const command = require(path.join(commandsPath, file)).default;
			if (!command) return;
			this.commands.set(command.data.name, command);
		}
	}
	public getCommands() {
		return this.commands.map((command) => ({
			name: command.data.name,
			value: command.data.name,
		}));
	}
}
