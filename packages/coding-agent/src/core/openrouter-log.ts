import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "../config.ts";

const LOG_FILENAME = "openrouter-attribution.ndjson";

export interface OpenRouterAttributionEntry {
	timestamp: number;
	sessionId: string;
	requestId: string | undefined;
	provider: string | undefined;
	upstreamModel: string | undefined;
	requestedModel: string;
	requestedProvider: string;
}

/** Get the path to the OpenRouter attribution NDJSON log file. */
export function getOpenRouterAttributionLogPath(): string {
	return join(getAgentDir(), LOG_FILENAME);
}

/**
 * Append a structured OpenRouter attribution entry to the NDJSON log.
 *
 * Creates the directory if necessary. Swallows errors silently to avoid
 * disrupting the stream on I/O failures.
 */
export function appendOpenRouterAttribution(entry: OpenRouterAttributionEntry): void {
	try {
		const logPath = getOpenRouterAttributionLogPath();
		mkdirSync(getAgentDir(), { recursive: true });
		appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
	} catch {
		// Silent failure: logging is best-effort
	}
}
