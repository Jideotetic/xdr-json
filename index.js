import fs from "fs";
import init, { decode, guess } from "@stellar/stellar-xdr-json";

// Load the wasm file manually as a buffer
const wasmBuffer = fs.readFileSync(
	"./node_modules/@stellar/stellar-xdr-json/stellar_xdr_json_bg.wasm"
);

await init(wasmBuffer);

const result = {
	transactionData:
		"AAAAAAAAAAIAAAAGAAAAAcwD/nT9D7Dc2LxRdab+2vEUF8B+XoN7mQW21oxPT8ALAAAAFAAAAAEAAAAHy8vNUZ8vyZ2ybPHW0XbSrRtP7gEWsJ6zDzcfY9P8z88AAAABAAAABgAAAAHMA/50/Q+w3Ni8UXWm/trxFBfAfl6De5kFttaMT0/ACwAAABAAAAABAAAAAgAAAA8AAAAHQ291bnRlcgAAAAASAAAAAAAAAAAg4dbAxsGAGICfBG3iT2cKGYQ6hK4sJWzZ6or1C5v6GAAAAAEAHfKyAAAFiAAAAIgAAAAAAAAAAw==",
	minResourceFee: "90353",
	events: [
		"AAAAAQAAAAAAAAAAAAAAAgAAAAAAAAADAAAADwAAAAdmbl9jYWxsAAAAAA0AAAAgzAP+dP0PsNzYvFF1pv7a8RQXwH5eg3uZBbbWjE9PwAsAAAAPAAAACWluY3JlbWVudAAAAAAAABAAAAABAAAAAgAAABIAAAAAAAAAACDh1sDGwYAYgJ8EbeJPZwoZhDqEriwlbNnqivULm/oYAAAAAwAAAAM=",
		"AAAAAQAAAAAAAAABzAP+dP0PsNzYvFF1pv7a8RQXwH5eg3uZBbbWjE9PwAsAAAACAAAAAAAAAAIAAAAPAAAACWZuX3JldHVybgAAAAAAAA8AAAAJaW5jcmVtZW50AAAAAAAAAwAAAAw=",
	],
	results: [
		{
			auth: [],
			xdr: "AAAAAwAAAAw=",
		},
	],
	cost: {
		cpuInsns: "1635562",
		memBytes: "1295756",
	},
	latestLedger: 2552139,
};

function decodeAllXdrStrings(obj) {
	if (obj === null || obj === undefined) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => {
			if (typeof item === "string") {
				try {
					const [valueType] = guess(item);
					return JSON.parse(decode(valueType, item));
				} catch (e) {
					// If it fails to decode, keep original value
					return item;
				}
			}
			return decodeAllXdrStrings(item);
		});
	}

	if (typeof obj === "object") {
		const newObj = {};
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "string") {
				try {
					// Attempt to decode all string values as XDR
					const [valueType] = guess(value);
					newObj[key] = JSON.parse(decode(valueType, value));
				} catch (e) {
					// If decoding fails, keep original value and move on
					newObj[key] = decodeAllXdrStrings(value);
				}
			} else {
				// Recursively handle non-string values
				newObj[key] = decodeAllXdrStrings(value);
			}
		}
		return newObj;
	}

	return obj;
}

const decodedResult = decodeAllXdrStrings(result);
console.dir(decodedResult, { depth: null });
