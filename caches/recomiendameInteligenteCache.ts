import { LRUCache } from "./base_caches/LRUCache";
import { maxCacheSize } from "../config.json";

export class recomiendameInteligenteCache {
	private static instance: recomiendameInteligenteCache;
	private cache: LRUCache<string, any> = new LRUCache(maxCacheSize);

	public static getInstance(): recomiendameInteligenteCache {
		if (!recomiendameInteligenteCache.instance) {
			recomiendameInteligenteCache.instance =
				new recomiendameInteligenteCache();
		}
		return recomiendameInteligenteCache.instance;
	}
	private constructor() {}

	public getNotas(
		input: string
	): { libro: string; nota: number }[] | undefined {
		const result = this.cache.get(input);
		if (result) return result;
		return;
	}

	public setNotas(input: string, output: { libro: string; nota: number }[]) {
		this.cache.put(input, output);
	}
	public resetNota(input: string) {
		this.cache.delete(input);
	}
}
