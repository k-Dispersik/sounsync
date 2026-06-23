import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger";

afterEach(() => {
    localStorage.clear();
});

describe("createLogger", () => {
    it("prefixes messages with the scope", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});

        createLogger("Rtc").error("boom", 1);

        expect(error).toHaveBeenCalledWith("[Rtc]", "boom", 1);
    });

    it("always reports warnings and errors", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = vi.spyOn(console, "error").mockImplementation(() => {});

        const log = createLogger("Channel");
        log.warn("late");
        log.error("dropped");

        expect(warn).toHaveBeenCalledOnce();
        expect(error).toHaveBeenCalledOnce();
    });

    it("stays quiet on debug and info until the flag is set", () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
        const info = vi.spyOn(console, "info").mockImplementation(() => {});

        const log = createLogger("Channel");
        log.debug("joining");
        log.info("joined");

        expect(debug).not.toHaveBeenCalled();
        expect(info).not.toHaveBeenCalled();

        localStorage.setItem("soundsync:debug", "1");
        log.debug("joining");
        log.info("joined");

        expect(debug).toHaveBeenCalledWith("[Channel]", "joining");
        expect(info).toHaveBeenCalledWith("[Channel]", "joined");
    });

    it("survives a browser that throws on localStorage", () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("access denied");
        });

        expect(() => createLogger("Channel").debug("hi")).not.toThrow();
        expect(debug).not.toHaveBeenCalled();
    });
});
