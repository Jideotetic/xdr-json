import StellarXDR from "./src/generated/StellarXDR_generated.js";

/**
 * Parses known XDR fields from a flat object.
 * Only decodes if the field exists and is a string or array of strings.
 *
 * @param data - The object with possible XDR fields.
 * @param {"getLedgerEntries" | "simulateTransaction"} [context] - Optional decoding context.
 * @returns A new object with decoded XDR values.
 */
export function xdrToParsed(data, context) {
	if (data === null) return data;

	const fieldMap = {
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

	function decodeValue(key, value) {
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
			} catch (err) {
				console.warn(`⚠️ Failed to decode ${key}: ${err.message}`);
				return value;
			}
		} else if (Array.isArray(value)) {
			return value.map((v, i) => decodeValue(key, v));
		} else if (value && typeof value === "object") {
			return decodeRecursive(value);
		}

		return value;
	}

	function decodeRecursive(obj) {
		if (Array.isArray(obj)) {
			return obj.map((item) => decodeRecursive(item));
		} else if (obj && typeof obj === "object") {
			const decodedObj = {};
			for (const [key, value] of Object.entries(obj)) {
				decodedObj[key] = decodeValue(key, value);
			}
			return decodedObj;
		}
		return obj;
	}

	return decodeRecursive(data);
}
