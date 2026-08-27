import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ConnectionBanner from "./ConnectionBanner";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("ConnectionBanner", () => {
    it("says nothing while everything is fine", () => {
        const { container } = render(<ConnectionBanner status="connected" />);

        expect(container).toBeEmptyDOMElement();
    });

    it("says nothing before the first connection either", () => {
        const { container } = render(<ConnectionBanner status="connecting" />);

        expect(container).toBeEmptyDOMElement();
    });

    it("shows the connection is gone", () => {
        render(<ConnectionBanner status="reconnecting" />);

        expect(screen.getByRole("status")).toHaveTextContent(/reconnecting/i);
    });

    it("admits that reconnecting replaced the local state", () => {
        render(<ConnectionBanner status="resynced" />);

        expect(screen.getByRole("status")).toHaveTextContent(/refreshed from the server/i);
    });

    it("stops nagging after a while", () => {
        render(<ConnectionBanner status="resynced" />);

        act(() => {
            vi.advanceTimersByTime(6_000);
        });

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
});
