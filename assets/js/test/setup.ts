import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom ships `<dialog>` without its methods, so anything built on the native
// dialog cannot be rendered at all. Enough of them to exercise open and close.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.open = true;
    };

    HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
        this.open = true;
    };

    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event("close"));
    };
}
