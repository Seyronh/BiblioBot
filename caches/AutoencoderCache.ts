import { LRUCache } from "./base_caches/LRUCache";
import { maxCacheSize } from "../config.json";
import tf from "@tensorflow/tfjs-node";

export class AutoencoderCache {
	private static instance: AutoencoderCache;
	private encoded: LRUCache<
		| Float32Array<ArrayBufferLike>
		| Int32Array<ArrayBufferLike>
		| Uint8Array<ArrayBufferLike>,
		tf.Tensor
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
		return this.encoded.get(entrada);
	}

	public saveEncoded(input: tf.Tensor, output: tf.Tensor) {
		this.encoded.put(input.dataSync(), output);
	}
}
