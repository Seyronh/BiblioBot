import { LRUCache } from "./base_caches/LRUCache";
import { maxCacheSize } from "../config.json";
import tf from "@tensorflow/tfjs-node";

export class AutoencoderCache {
	private static instance: AutoencoderCache;
	private encoded: LRUCache<
		| Float32Array<ArrayBufferLike>
		| Int32Array<ArrayBufferLike>
		| Uint8Array<ArrayBufferLike>,
		any
	> = new LRUCache(maxCacheSize);

	public static getInstance(): AutoencoderCache {
		if (!AutoencoderCache.instance) {
			AutoencoderCache.instance = new AutoencoderCache();
		}
		return AutoencoderCache.instance;
	}
	private constructor() {}

	public getEncoded(input: tf.Tensor): tf.Tensor | undefined {
		const entrada = input.dataSync();
		const result = this.encoded.get(entrada);
		if (result) return tf.tensor(result);
		return;
	}

	public saveEncoded(input: tf.Tensor, output: tf.Tensor) {
		this.encoded.put(input.dataSync(), output.arraySync());
	}
}
