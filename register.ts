import { REST, Routes } from "discord.js";
import { discord_token } from "./config.json";
import { SlashManager } from "./Managers/SlashManager";

const slashManager = SlashManager.getInstance();

const datos = slashManager.getCommandsJSON();
const rest = new REST().setToken(discord_token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${datos.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands("1321177048202350592"),
			{
				body: datos,
			}
		);
		console.log(
			// @ts-ignore: Unreachable code error
			`Successfully reloaded ${data.length} application (/) commands.`
		);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
