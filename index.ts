import StellarXDR from "./src/generated/StellarXDR_generated.js";

type Context = "getLedgerEntries" | "simulateTransaction" | undefined;

type XdrData = unknown;

interface XdrType {
	fromXDR(input: string, format: "base64"): unknown;
}

type FieldMap = Record<string, XdrType | undefined>;

/**
 * Parses known XDR fields from a flat object.
 * Only decodes if the field exists and is a string or array of strings.
 *
 * @param data - The object with possible XDR fields.
 * @param context - Optional decoding context.
 * @returns A new object with decoded XDR values.
 */
export function xdrToParsed(data: XdrData, context?: Context): XdrData {
	if (data === null) return data;

	const fieldMap: FieldMap = {
		envelopeXdr: StellarXDR.TransactionEnvelope,
		resultXdr: StellarXDR.TransactionResult,
		resultMetaXdr: StellarXDR.TransactionMeta,
		diagnosticEventsXdr: StellarXDR.DiagnosticEvent,
		transactionEventsXdr: StellarXDR.TransactionEvent,
		contractEventsXdr: StellarXDR.ContractEvent,
		topic: StellarXDR.ScVal,
		value: StellarXDR.ScVal,
		key: StellarXDR.LedgerKey,
		headerXdr: StellarXDR.LedgerHeaderHistoryEntry,
		metadataXdr: StellarXDR.LedgerCloseMeta,
		transactionData: StellarXDR.SorobanTransactionData,
		events: StellarXDR.TransactionEvent, // Could possibly be DiagnosticEvent
	};

	if (context === "getLedgerEntries") {
		fieldMap.xdr = StellarXDR.LedgerEntryData;
	} else if (context === "simulateTransaction") {
		fieldMap.xdr = StellarXDR.ConfigSettingContractHistoricalDataV0;
	} else {
		delete fieldMap.xdr;
	}

	function decodeValue(key: string, value: unknown): unknown {
		const XdrType = fieldMap[key];
		if (!XdrType) {
			if (value && typeof value === "object") {
				return decodeRecursive(value);
			}
			return value;
		}

		if (typeof value === "string") {
			try {
				return XdrType.fromXDR(value, "base64");
			} catch (err: any) {
				console.warn(`⚠️ Failed to decode ${key}: ${err.message}`);
				return value;
			}
		} else if (Array.isArray(value)) {
			return value.map((v) => decodeValue(key, v));
		} else if (value && typeof value === "object") {
			return decodeRecursive(value);
		}

		return value;
	}

	function decodeRecursive(obj: unknown): unknown {
		if (Array.isArray(obj)) {
			return obj.map(decodeRecursive);
		} else if (obj && typeof obj === "object") {
			const decodedObj: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				decodedObj[key] = decodeValue(key, value);
			}
			return decodedObj;
		}
		return obj;
	}

	return decodeRecursive(data);
}

export type XdrTypeName =
	| "TransactionEnvelope"
	| "TransactionResult"
	| "TransactionMeta"
	| "DiagnosticEvent"
	| "TransactionEvent"
	| "ContractEvent"
	| "ScVal"
	| "LedgerKey"
	| "LedgerEntryData"
	| "LedgerHeaderHistoryEntry"
	| "DiagnosticEvent"
	| "LedgerCloseMeta"
	| "SorobanTransactionData"
	| "ConfigSettingContractHistoricalDataV0";

/**
 * Decodes a single XDR string using a provided XDR type name.
 *
 * @param xdr - The base64-encoded XDR string.
 * @param type - The name of the XDR type to decode.
 * @returns The decoded object or the original string if decoding fails.
 */
export function parseXdrString(xdr: string, type: XdrTypeName): unknown {
	if (!xdr || !type) return xdr;

	const XdrType = (StellarXDR as Record<string, any>)[type];

	if (!XdrType || typeof XdrType.fromXDR !== "function") {
		console.warn(`⚠️ Invalid or unknown XDR type: ${type}`);
		return xdr;
	}

	try {
		return XdrType.fromXDR(xdr, "base64");
	} catch (err: any) {
		console.warn(`⚠️ Failed to decode: ${err.message}`);
		return xdr;
	}
}
