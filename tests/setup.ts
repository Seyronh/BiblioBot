import { mock } from "bun:test";
import DiscordJS from "discord.js";
import EventEmitter from "events";

delete process.env["DISCORD_TOKEN"];
delete process.env["PINECONE_API_KEY"];
delete process.env["TURSO_DB_URL"];
delete process.env["TURSO_AUTH_TOKEN"];

mock.module("discord.js", async () => {
	return {
		...DiscordJS,
		Client: class extends EventEmitter {
			public user = {
				tag: "test",
			};
			login() {
				this.emit("ready");
			}
		},
	};
});

mock.module("@pinecone-database/pinecone", async () => {
	return {
		Pinecone: class {
			index() {}
		},
	};
});
console.log = () => {};
