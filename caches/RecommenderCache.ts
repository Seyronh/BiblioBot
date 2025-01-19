import { LRUCache } from "./base_caches/LRUCache";
import { maxCacheSize } from "../config.json";
import tf from "@tensorflow/tfjs-node";

export class RecommenderCache {
	private static instance: RecommenderCache;
	private predicts: LRUCache<
		| Float32Array<ArrayBufferLike>
		| Int32Array<ArrayBufferLike>
		| Uint8Array<ArrayBufferLike>,
		any
	> = new LRUCache(maxCacheSize);

	public static getInstance(): RecommenderCache {
		if (!RecommenderCache.instance) {
			RecommenderCache.instance = new RecommenderCache();
		}
		return RecommenderCache.instance;
	}
	private constructor() {}

	public getPredict(input: tf.Tensor): tf.Tensor | undefined {
		const entrada = input.dataSync();
		const salida = this.predicts.get(entrada);
		if (salida) return tf.tensor(salida);
		return;
	}

	public savePredict(input: tf.Tensor, output: tf.Tensor) {
		this.predicts.put(input.dataSync(), output.arraySync());
	}
}
