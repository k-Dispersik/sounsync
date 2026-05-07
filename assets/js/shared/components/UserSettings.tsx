import { Settings } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function UserSettings() {
    return (
        <div className="dropdown dropdown-left">
            <div
                tabIndex={0}
                role="button"
                className="w-8 h-8 rounded-md hover:bg-base-content/[0.08] flex items-center justify-center text-base-content/40 hover:text-base-content/70 transition-colors cursor-pointer"
            >
                <Settings size={15} />
            </div>
            <ul tabIndex={-1} className="dropdown-content bg-base-200 border border-base-content/10 rounded-lg z-40 w-48 p-2 shadow-lg">
                <li><button className="w-full btn btn-ghost justify-start">Profile</button></li>
                <li><ThemeSwitcher /></li>
            </ul>
        </div>
    );
}