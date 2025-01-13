export function hexToArrayBuffer(input) {
	if (typeof input !== "string") {
		throw new TypeError("Expected input to be a string");
	}

	if (input.length % 2 !== 0) {
		throw new RangeError("Expected string to be an even number of characters");
	}

	const view = new Uint8Array(input.length / 2);

	for (let i = 0; i < input.length; i += 2) {
		view[i / 2] = parseInt(input.substring(i, i + 2), 16);
	}

	return view.buffer;
}
export function arrayBufferToHex(arrayBuffer) {
	if (
		typeof arrayBuffer !== "object" ||
		arrayBuffer === null ||
		typeof arrayBuffer.byteLength !== "number"
	) {
		throw new TypeError("Expected input to be an ArrayBuffer");
	}

	var view = new Uint8Array(arrayBuffer);
	var result = "";
	var value;

	for (var i = 0; i < view.length; i++) {
		value = view[i].toString(16);
		result += value.length === 1 ? "0" + value : value;
	}

	return result;
}
