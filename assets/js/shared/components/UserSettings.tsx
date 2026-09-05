import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/shared/ui";
import ThemeSwitcher from "./ThemeSwitcher";

/**
 * The settings popover.
 *
 * Closes on Escape and on a click elsewhere, because a menu that only closes
 * by clicking the thing that opened it is a menu people learn to avoid.
 */
export default function UserSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
        };

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <IconButton
                label="Settings"
                size="sm"
                icon={<Settings size={15} />}
                active={isOpen}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            />

            {isOpen && (
                <div
                    className="absolute right-0 top-9 z-50 w-52 rounded-lg border border-token
                        bg-surface p-3 shadow-lg"
                >
                    <ThemeSwitcher />
                </div>
            )}
        </div>
    );
}
