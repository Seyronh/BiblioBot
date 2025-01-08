export class LRUCache<K, V> {
	private capacity: number;
	private cache: Map<K, V>;

	constructor(capacity: number) {
		this.capacity = capacity;
		this.cache = new Map<K, V>();
	}

	// Get the value associated with the key
	get(key: K): V | undefined {
		if (!this.cache.has(key)) {
			return undefined;
		}
		const value = this.cache.get(key);
		this.cache.delete(key);
		this.cache.set(key, value);
		return value;
	}

	// Put a key-value pair into the cache
	put(key: K, value: V) {
		if (this.cache.has(key)) {
			this.delete(key);
		} else if (this.cache.size >= this.capacity) {
			const oldestKey = this.cache.keys().next().value;
			this.delete(oldestKey);
		}
		this.cache.set(key, value);
	}

	// Delete a key-value pair from the cache
	delete(key: K) {
		this.cache.delete(key);
	}

	// Delete all key-value pairs that match the given regular expression
	deleteAll(key: RegExp) {
		for (const prop of this.cache.keys()) {
			if (key.test(prop.toString())) {
				this.cache.delete(prop);
			}
		}
	}
}
