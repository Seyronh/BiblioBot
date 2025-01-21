import { LRUCache } from "./base_caches/LRUCache";
import { maxCacheSize } from "../config.json";
import tf from "@tensorflow/tfjs-node";

export class getInputByID {
	private static instance: getInputByID;
	private cache: LRUCache<string, any> = new LRUCache(maxCacheSize);

	public static getInstance(): getInputByID {
		if (!getInputByID.instance) {
			getInputByID.instance = new getInputByID();
		}
		return getInputByID.instance;
	}
	private constructor() {}

	public getTensor(input: string): tf.Tensor | undefined {
		const result = this.cache.get(input);
		if (result) return tf.tensor(result);
		return;
	}

	public setTensor(input: string, output: tf.Tensor) {
		this.cache.put(input, output.arraySync());
	}
	public resetTensor(input: string) {
		this.cache.delete(input);
	}
}
