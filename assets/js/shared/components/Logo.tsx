import { Music2 } from "lucide-react";

export function Logo({ size = 16, showText = true }: { size?: number; showText?: boolean }) {
    return (
        <div className="flex w-52 flex-shrink-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                <Music2 size={size} className="text-primary-content" />
            </div>
            {showText && <span className="text-sm font-semibold text-default">SoundSync</span>}
        </div>
    );
}
