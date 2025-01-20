import { Client, createClient } from "@libsql/client";
export class SQLConnection {
	private static instance: SQLConnection;
	private database: Client;
	private constructor() {
		this.database = createClient({
			url: process.env.TURSO_DB_URL || ":memory:",
			authToken: process.env.TURSO_AUTH_TOKEN,
		});
	}
	public static getInstance() {
		if (!SQLConnection.instance) {
			SQLConnection.instance = new SQLConnection();
		}
		return SQLConnection.instance;
	}
	public async executeQuery<T>(query: string, args: any[] = []): Promise<T[]> {
		const result = await await this.database.execute({
			sql: query,
			args: args,
		});
		return result.rows as T[];
	}
}
