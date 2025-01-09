import { mock } from "bun:test";
import DiscordJS from "discord.js";
import EventEmitter from "events";

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
console.log = () => {};
