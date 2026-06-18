import { describe, expect, it, vi } from "vitest";
import { InteractiveMode } from "../../../src/modes/interactive/interactive-mode.ts";

type SubmitHandlerContext = {
	defaultEditor: { onSubmit?: (text: string) => Promise<void> };
	editor: { setText: (text: string) => void };
	session: { isStreaming: boolean; isCompacting: boolean };
	shutdownRequested: boolean;
	shutdown: () => Promise<void>;
	showWarning: (message: string) => void;
};

type InteractiveModePrototype = {
	setupEditorSubmitHandler(this: SubmitHandlerContext): void;
};

const interactiveModePrototype = InteractiveMode.prototype as unknown as InteractiveModePrototype;

describe("InteractiveMode queued quit", () => {
	it("quits immediately when idle", async () => {
		const setText = vi.fn();
		const shutdown = vi.fn(async () => {});
		const showWarning = vi.fn();

		const context: SubmitHandlerContext = {
			defaultEditor: {},
			editor: { setText },
			session: { isStreaming: false, isCompacting: false },
			shutdownRequested: false,
			shutdown,
			showWarning,
		};

		interactiveModePrototype.setupEditorSubmitHandler.call(context);
		expect(context.defaultEditor.onSubmit).toBeDefined();

		await context.defaultEditor.onSubmit!("/quitq");

		expect(setText).toHaveBeenCalledWith("");
		expect(shutdown).toHaveBeenCalled();
		expect(context.shutdownRequested).toBe(false);
		expect(showWarning).not.toHaveBeenCalled();
	});

	it("queues a quit when streaming", async () => {
		const setText = vi.fn();
		const shutdown = vi.fn(async () => {});
		const showWarning = vi.fn();

		const context: SubmitHandlerContext = {
			defaultEditor: {},
			editor: { setText },
			session: { isStreaming: true, isCompacting: false },
			shutdownRequested: false,
			shutdown,
			showWarning,
		};

		interactiveModePrototype.setupEditorSubmitHandler.call(context);
		await context.defaultEditor.onSubmit!("/quitq");

		expect(setText).toHaveBeenCalledWith("");
		expect(shutdown).not.toHaveBeenCalled();
		expect(context.shutdownRequested).toBe(true);
		expect(showWarning).toHaveBeenCalledWith(
			"Quit queued. The agent will exit after the current run completes. Type /quitq again to cancel.",
		);
	});

	it("cancels a queued quit when run again during streaming", async () => {
		const setText = vi.fn();
		const shutdown = vi.fn(async () => {});
		const showWarning = vi.fn();

		const context: SubmitHandlerContext = {
			defaultEditor: {},
			editor: { setText },
			session: { isStreaming: true, isCompacting: false },
			shutdownRequested: true,
			shutdown,
			showWarning,
		};

		interactiveModePrototype.setupEditorSubmitHandler.call(context);
		await context.defaultEditor.onSubmit!("/quitq");

		expect(setText).toHaveBeenCalledWith("");
		expect(shutdown).not.toHaveBeenCalled();
		expect(context.shutdownRequested).toBe(false);
		expect(showWarning).toHaveBeenCalledWith("Queued quit cancelled.");
	});

	it("supports /qquit alias", async () => {
		const setText = vi.fn();
		const shutdown = vi.fn(async () => {});
		const showWarning = vi.fn();

		const context: SubmitHandlerContext = {
			defaultEditor: {},
			editor: { setText },
			session: { isStreaming: true, isCompacting: false },
			shutdownRequested: false,
			shutdown,
			showWarning,
		};

		interactiveModePrototype.setupEditorSubmitHandler.call(context);
		await context.defaultEditor.onSubmit!("/qquit");

		expect(setText).toHaveBeenCalledWith("");
		expect(shutdown).not.toHaveBeenCalled();
		expect(context.shutdownRequested).toBe(true);
		expect(showWarning).toHaveBeenCalledWith(
			"Quit queued. The agent will exit after the current run completes. Type /quitq again to cancel.",
		);
	});
});
