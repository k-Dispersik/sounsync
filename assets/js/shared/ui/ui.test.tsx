import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, IconButton, Input, Modal, Select, Tooltip } from "./index";

describe("Button", () => {
    it("is not a submit button unless asked", () => {
        render(<Button>Save</Button>);

        expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("shows it is busy and refuses further clicks", async () => {
        const onClick = vi.fn();
        render(
            <Button loading onClick={onClick}>
                Save
            </Button>,
        );

        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "true");

        await userEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });
});

describe("IconButton", () => {
    it("has a name even though it shows only an icon", () => {
        render(<IconButton label="Mute track" icon={<span>M</span>} />);

        expect(screen.getByRole("button", { name: "Mute track" })).toBeInTheDocument();
    });

    it("reports whether it is on", () => {
        render(<IconButton label="Solo" icon={<span>S</span>} active />);

        expect(screen.getByRole("button", { name: "Solo" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });
});

describe("Input", () => {
    it("ties the label to the field", async () => {
        render(<Input label="Email" />);

        await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");

        expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    });

    it("announces its error rather than only colouring it", () => {
        render(<Input label="Email" error="has invalid format" />);

        const field = screen.getByLabelText("Email");
        expect(field).toHaveAttribute("aria-invalid", "true");
        expect(field).toHaveAccessibleDescription("has invalid format");
        expect(screen.getByRole("alert")).toHaveTextContent("has invalid format");
    });

    it("describes itself with a hint when there is no error", () => {
        render(<Input label="Tempo" hint="Between 20 and 300" />);

        expect(screen.getByLabelText("Tempo")).toHaveAccessibleDescription("Between 20 and 300");
    });

    it("a hidden label is still a label", () => {
        render(<Input label="Search" labelHidden />);

        expect(screen.getByLabelText("Search")).toBeInTheDocument();
    });
});

describe("Select", () => {
    const options = [
        { value: "4/4", label: "4/4" },
        { value: "7/8", label: "7/8" },
    ] as const;

    it("reports the chosen value", async () => {
        const onChange = vi.fn();
        render(<Select label="Time signature" value="4/4" options={options} onChange={onChange} />);

        await userEvent.selectOptions(screen.getByLabelText("Time signature"), "7/8");

        expect(onChange).toHaveBeenCalledWith("7/8");
    });
});

describe("Modal", () => {
    it("shows its title and content when open", () => {
        render(
            <Modal title="Add clip" open onClose={vi.fn()}>
                <p>Body</p>
            </Modal>,
        );

        expect(screen.getByRole("heading", { name: "Add clip" })).toBeInTheDocument();
        expect(screen.getByText("Body")).toBeInTheDocument();
    });

    it("closes on the close button", async () => {
        const onClose = vi.fn();
        render(
            <Modal title="Add clip" open onClose={onClose}>
                <p>Body</p>
            </Modal>,
        );

        await userEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(onClose).toHaveBeenCalled();
    });
});

describe("Tooltip", () => {
    it("describes what it wraps", () => {
        render(
            <Tooltip text="Play from the start">
                <button>Play</button>
            </Tooltip>,
        );

        expect(screen.getByRole("tooltip")).toHaveTextContent("Play from the start");
    });
});
