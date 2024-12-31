import path from "path";
import { Perms } from "../interfaces";

export class PermManager {
	private static instance: PermManager;
	private config;
	public static getInstance(): PermManager {
		if (!PermManager.instance) {
			return new PermManager();
		}
		return PermManager.instance;
	}

	private constructor() {
		this.config = require("../config.json");
	}
	public isBanned(id: string) {
		return this.config.banned.includes(id);
	}
	public isDeveloper(id: string) {
		return this.config.desarrolladores.includes(id);
	}
	private isColaborator(id: string) {
		return this.config.colaboradores.includes(id);
	}
	private isModerator(id: string) {
		return this.config.moderadores.includes(id);
	}
	public getPermissions(id: string): Perms {
		const perms: Perms = {
			create:
				this.isDeveloper(id) || this.isColaborator(id) || this.isModerator(id),
			update: this.isDeveloper(id) || this.isModerator(id),
			delete: this.isDeveloper(id) || this.isModerator(id),
		};
		return perms;
	}
	public resetPermissions() {
		delete require.cache[
			require.resolve(path.join(__dirname, "..", "config.json"))
		];
		this.config = require("../config.json");
	}
}
