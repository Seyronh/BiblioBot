import { Database, SQLQueryBindings } from "bun:sqlite";
export class SQLConnection {
	private static instance: SQLConnection;
	private database: Database;
	private constructor() {
		this.database = new Database("./database.db");
	}
	public static getInstance() {
		if (!SQLConnection.instance) {
			SQLConnection.instance = new SQLConnection();
		}
		return SQLConnection.instance;
	}
	public async executeQuery<T>(
		query: string,
		args: SQLQueryBindings[] = []
	): Promise<T[]> {
		const statement = this.database.query(query);
		const result = statement.all(...args);
		return result as T[];
	}
}
