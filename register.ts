import { REST, Routes } from "discord.js";

import { SlashManager } from "./managers/SlashManager";

const slashManager = SlashManager.getInstance();

const datos = slashManager.getCommandsJSON();
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${datos.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const dataGlobal = (await rest.put(
			Routes.applicationCommands("1321177048202350592"),
			{
				body: datos.filter((d) => !d.guildOnly).map((d) => d.data),
			}
		)) as any;
		const dataGuild = (await rest.put(
			Routes.applicationGuildCommands(
				"1321177048202350592",
				"1165357789774876672"
			),
			{
				body: datos.filter((d) => d.guildOnly).map((d) => d.data),
			}
		)) as any;
		console.log(
			// @ts-ignore: Unreachable code error
			`Successfully reloaded ${
				dataGlobal.length + dataGuild.length
			} application (/) commands.`
		);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
