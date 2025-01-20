import { SqlCache } from "../../caches";
import { SQLConnection } from "./SQLConnection";
import { maxLibrosPorPagina } from "../../config.json";

export class ListManager {
	private static instance: ListManager;
	private constructor() {}
	public static getInstance() {
		if (!ListManager.instance) {
			ListManager.instance = new ListManager();
		}
		return ListManager.instance;
	}
	public async updateBook(title: string, newtitle: string): Promise<void> {
		await SQLConnection.getInstance().executeQuery<void>(
			`UPDATE Listas SET TituloLibro = ? WHERE TituloLibro = ?`,
			[newtitle, title]
		);
	}
	public async deleteBook(title: string): Promise<void> {
		await SQLConnection.getInstance().executeQuery<void>(
			`DELETE FROM Listas WHERE TituloLibro = ?`,
			[title]
		);
	}
	public async existsList(userid: string, title?: string): Promise<boolean> {
		const cache = title
			? SqlCache.getInstance().getExistsListBook(userid, title)
			: SqlCache.getInstance().getExistsList(userid);
		if (cache) return cache;
		const result = await SQLConnection.getInstance().executeQuery<number>(
			title
				? `SELECT 1 FROM Listas WHERE UserID = ? AND TituloLibro = ? LIMIT 1`
				: `SELECT 1 FROM Listas WHERE UserID = ? LIMIT 1`,
			title ? [userid, title] : [userid]
		);
		const exists = result.length > 0;
		title
			? SqlCache.getInstance().saveExistsListBook(userid, title, exists)
			: SqlCache.getInstance().saveExistsList(userid, exists);
		return exists;
	}

	public async getList(
		userid: string,
		estado: number,
		offset?: number
	): Promise<string[]> {
		const cache = offset
			? SqlCache.getInstance().getList(userid, offset, estado)
			: SqlCache.getInstance().getListNoOffset(userid, estado);
		if (cache) return cache;
		const result = await SQLConnection.getInstance().executeQuery<{
			TituloLibro: string;
		}>(
			offset
				? `SELECT * FROM Listas WHERE userID = ? AND Estado = ? LIMIT ${maxLibrosPorPagina} OFFSET ?`
				: `SELECT TituloLibro FROM Listas WHERE userID = ? AND Estado = ?`,
			offset ? [userid, estado, offset] : [userid, estado]
		);
		const list = result.map((row) => row.TituloLibro);
		offset
			? SqlCache.getInstance().saveList(userid, offset, estado, list)
			: SqlCache.getInstance().saveListNoOffset(userid, estado, list);
		return list;
	}

	public async getListCount(userid: string, estado: number): Promise<number> {
		const result = await SQLConnection.getInstance().executeQuery<{
			count: number;
		}>(`SELECT COUNT(*) as count FROM Listas WHERE UserID = ? AND Estado = ?`, [
			userid,
			estado,
		]);
		return result[0].count;
	}
	public async getLeidosOrLeyendo(userid: string): Promise<string[]> {
		const listas = await SQLConnection.getInstance().executeQuery<{
			TituloLibro: string;
		}>(
			`SELECT TituloLibro FROM Listas WHERE userID = ? AND (Estado = 1 OR Estado = 0)`,
			[userid]
		);
		return listas.map((e) => {
			return e.TituloLibro;
		}) as string[];
	}
	public async unmarkBook(userid: string, title: string) {
		if (!(await this.existsList(userid, title))) return;
		await SQLConnection.getInstance().executeQuery<void>(
			`DELETE FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			[userid, title]
		);
		const dbcache = SqlCache.getInstance();
		dbcache.resetList(userid);
		dbcache.resetListNoOffset(userid);
		dbcache.resetExistsList(userid);
	}
	public async markBook(userid: string, title: string, estado: number) {
		await SQLConnection.getInstance().executeQuery<void>(
			`INSERT INTO Listas (userID, TituloLibro, Estado) VALUES (?, ?, ?) ON CONFLICT (userID, TituloLibro) DO UPDATE SET Estado = excluded.Estado`,
			[userid, title, estado]
		);
		const dbcache = SqlCache.getInstance();
		dbcache.saveExistsList(userid, true);
		dbcache.resetList(userid);
		dbcache.resetListNoOffset(userid);
	}
	public async markPage(userid: string, titulo: string, pagina: number) {
		await SQLConnection.getInstance().executeQuery<void>(
			`UPDATE Listas SET Pagina = ? WHERE userID = ? AND TituloLibro = ?`,
			[pagina, userid, titulo]
		);
		SqlCache.getInstance().resetUserBookInfo(userid, titulo);
	}
	public async getUserBookInfo(
		userid: string,
		title: string
	): Promise<{ Pagina: number; Nota: number }> {
		const cache = SqlCache.getInstance().getUserBookInfo(userid, title);
		if (cache) return cache;
		const listas = await SQLConnection.getInstance().executeQuery<{
			Pagina: number;
			Nota: number;
		}>(`SELECT Pagina, Nota FROM Listas WHERE userID = ? AND TituloLibro = ?`, [
			userid,
			title,
		]);
		if (listas.length == 0) {
			SqlCache.getInstance().saveUserBookInfo(userid, title, {
				Pagina: -1,
				Nota: -1,
			});
			return { Pagina: -1, Nota: -1 };
		}
		const info = { Pagina: listas[0].Pagina, Nota: listas[0].Nota };
		SqlCache.getInstance().saveUserBookInfo(userid, title, info);
		return info;
	}
	public async getNotaMedia(
		title: string
	): Promise<{ media: number; count: number }> {
		const cache = SqlCache.getInstance().getNotaMedia(title);
		if (cache) return cache;
		const listas = await SQLConnection.getInstance().executeQuery<{
			"AVG(Nota)": number;
			"COUNT(Nota)": number;
		}>(`SELECT AVG(Nota), COUNT(Nota) FROM Listas WHERE TituloLibro = ?`, [
			title,
		]);
		const count = {
			media: listas[0]["AVG(Nota)"],
			count: listas[0]["COUNT(Nota)"],
		};
		SqlCache.getInstance().saveNotaMedia(title, count);
		return count;
	}
	public async setNota(userid: string, title: string, nota: number) {
		await SQLConnection.getInstance().executeQuery<void>(
			`UPDATE Listas SET Nota = ? WHERE userID = ? AND TituloLibro = ?`,
			[nota, userid, title]
		);
		SqlCache.getInstance().resetNotaMedia(title);
	}
	public async deleteNota(userid: string, title: string) {
		await SQLConnection.getInstance().executeQuery<void>(
			`UPDATE Listas SET Nota = NULL WHERE userID = ? AND TituloLibro = ?`,
			[userid, title]
		);
		SqlCache.getInstance().deleteNota(userid, title);
	}
	public async getAllIds(): Promise<string[]> {
		const result = await SQLConnection.getInstance().executeQuery<{
			userID: string;
		}>(`SELECT DISTINCT userID FROM Listas`);
		return result.map((row) => row.userID);
	}
	public async getTitleNotaPairs() {
		const result = await SQLConnection.getInstance().executeQuery<{
			userID: string;
			TituloLibro: string;
			Nota: number;
			Estado: number;
		}>(
			`SELECT userID, TituloLibro, Nota, Estado FROM Listas WHERE Estado = 0 OR Estado = 1`
		);
		const resultado = result.map((e) => {
			return {
				id: e.userID as string,
				titulo: e.TituloLibro as string,
				nota: (e.Nota == null ? (e.Estado == 0 ? 5.2 : 5) : e.Nota) as number,
			};
		});
		return resultado;
	}
}
