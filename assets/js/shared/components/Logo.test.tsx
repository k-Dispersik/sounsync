import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./Logo";

describe("Logo", () => {
    it("renders the product name by default", () => {
        render(<Logo />);

        expect(screen.getByText("SoundSync")).toBeInTheDocument();
    });

    it("hides the name when showText is off", () => {
        render(<Logo showText={false} />);

        expect(screen.queryByText("SoundSync")).not.toBeInTheDocument();
    });
});
