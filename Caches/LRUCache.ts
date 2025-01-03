export class LRUCache<K, V> {
	private capacity: number;
	private cache: Map<K, V>;
	constructor(capacity: number) {
		this.capacity = capacity;
		this.cache = new Map<K, V>();
	}
	get(key: K): V | undefined {
		if (!this.cache.has(key)) {
			return undefined;
		}
		const value = this.cache.get(key);
		this.cache.delete(key);
		this.cache.set(key, value);
		return value;
	}
	put(key: K, value: V) {
		if (this.cache.has(key)) {
			this.cache.delete(key);
		} else if (this.cache.size >= this.capacity) {
			const oldestKey = this.cache.keys().next().value;
			this.cache.delete(oldestKey);
		}
		this.cache.set(key, value);
	}
}
