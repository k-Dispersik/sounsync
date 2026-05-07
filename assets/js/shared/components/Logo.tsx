import { Music2 } from "lucide-react";

export function Logo({ size = 16, showText = true }: { size?: number; showText?: boolean }) {
    return (
        <div className="flex items-center gap-3 w-52 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Music2 size={size} className="text-white" />
            </div>
            {showText && <span className="font-semibold text-white text-sm">SoundSync</span>}
        </div>
    );
}