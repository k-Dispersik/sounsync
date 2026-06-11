import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ThemeSwitcher() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="w-full btn btn-ghost justify-start"
                onClick={() => setIsOpen(!isOpen)}
            >
                Themes
                <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className={`${isOpen ? "block" : "hidden"} transition-all transform origin-top-left`}
            >
                <ThemeItem label="Default" value="default" />
                <ThemeItem label="Dark" value="dark" />
                <ThemeItem label="Light" value="light" />
            </div>
        </>
    );
}

function ThemeItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start text-base-content/60 checked:bg-primary/15 checked:text-primary"
                aria-label={label}
                value={value}
            />
        </div>
    );
}
