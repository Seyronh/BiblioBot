import {
	CommandInteraction,
	Collection,
	AutocompleteInteraction,
	ButtonInteraction,
	StringSelectMenuInteraction,
} from "discord.js";

import commands from "../commands";
import { Command } from "../types.js";

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
		return this.commands.map((command) => ({
			data: command.data.toJSON(),
			guildOnly: command.guildOnly,
		}));
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
	private loadCommands() {
		for (const commandName of Object.keys(commands)) {
			const command = commands[commandName];
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
