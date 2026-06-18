import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ENV_AGENT_DIR } from "../src/config.ts";
import { appendOpenRouterAttribution } from "../src/core/openrouter-log.ts";

describe("OpenRouter attribution log", () => {
	let originalEnv: string | undefined;
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pi-or-log-"));
		originalEnv = process.env[ENV_AGENT_DIR];
		process.env[ENV_AGENT_DIR] = tempDir;
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env[ENV_AGENT_DIR];
		} else {
			process.env[ENV_AGENT_DIR] = originalEnv;
		}
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("appends a valid JSON line per entry", () => {
		appendOpenRouterAttribution({
			timestamp: 1234567890000,
			sessionId: "sess-abc",
			requestId: "gen-123",
			provider: "WandB",
			upstreamModel: "moonshotai/kimi-k2.6-20260420",
			requestedModel: "moonshotai/kimi-k2.6",
			requestedProvider: "openrouter",
		});

		const logPath = join(tempDir, "openrouter-attribution.ndjson");
		expect(existsSync(logPath)).toBe(true);

		const lines = readFileSync(logPath, "utf-8").trim().split("\n");
		expect(lines.length).toBe(1);

		const parsed = JSON.parse(lines[0]);
		expect(parsed.timestamp).toBe(1234567890000);
		expect(parsed.sessionId).toBe("sess-abc");
		expect(parsed.requestId).toBe("gen-123");
		expect(parsed.provider).toBe("WandB");
		expect(parsed.upstreamModel).toBe("moonshotai/kimi-k2.6-20260420");
		expect(parsed.requestedModel).toBe("moonshotai/kimi-k2.6");
		expect(parsed.requestedProvider).toBe("openrouter");
	});

	it("appends multiple entries as separate NDJSON lines", () => {
		for (let i = 0; i < 3; i++) {
			appendOpenRouterAttribution({
				timestamp: 1234567890000 + i,
				sessionId: "sess-abc",
				requestId: `gen-${i}`,
				provider: i % 2 === 0 ? "WandB" : "Akash",
				upstreamModel: "moonshotai/kimi-k2.6-20260420",
				requestedModel: "moonshotai/kimi-k2.6",
				requestedProvider: "openrouter",
			});
		}

		const logPath = join(tempDir, "openrouter-attribution.ndjson");
		const lines = readFileSync(logPath, "utf-8").trim().split("\n");
		expect(lines.length).toBe(3);

		for (let i = 0; i < 3; i++) {
			const parsed = JSON.parse(lines[i]);
			expect(parsed.requestId).toBe(`gen-${i}`);
			expect(parsed.provider).toBe(i % 2 === 0 ? "WandB" : "Akash");
		}
	});

	it("handles undefined responseProvider gracefully", () => {
		appendOpenRouterAttribution({
			timestamp: 1234567890000,
			sessionId: "sess-missing",
			requestId: "gen-456",
			provider: undefined,
			upstreamModel: undefined,
			requestedModel: "openrouter/auto",
			requestedProvider: "openrouter",
		});

		const logPath = join(tempDir, "openrouter-attribution.ndjson");
		const lines = readFileSync(logPath, "utf-8").trim().split("\n");
		expect(lines.length).toBe(1);

		const parsed = JSON.parse(lines[0]);
		expect(parsed.provider).toBeUndefined();
		expect(parsed.upstreamModel).toBeUndefined();
	});
});
