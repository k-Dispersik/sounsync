import {
    SkipBack,
    Square,
    Play,
    Pause,
    Circle,
    SkipForward,
    Repeat2
} from "lucide-react";
import { ReactNode } from "react";
import { useTransportContext } from "../contextProviders/TransportProvider";

export default function Transport() {
    const { isPlaying, play, pause, stop } = useTransportContext();

    return (
        <>
            <TransportBtn><SkipBack size={15} /></TransportBtn>
            <TransportBtn onClick={stop}><Square size={15} /></TransportBtn>
            {isPlaying ? (
                <TransportBtn onClick={pause}><Pause size={15} /></TransportBtn>
            ) : (
                <TransportBtn onClick={play}><Play size={16} className="text-base-content ml-0.5" /></TransportBtn>
            )}
            <TransportBtn><Circle size={15} className="text-red-400" /></TransportBtn>
            <TransportBtn><SkipForward size={15} /></TransportBtn>
            <TransportBtn><Repeat2 size={15} /></TransportBtn>
        </>
    );
}

function TransportBtn({ children, onClick }: { children: ReactNode, onClick?: () => void }) {
    return (
        <button className="w-9 h-9 rounded-md hover:bg-base-content/[0.08] flex items-center justify-center text-base-content/60 hover:text-base-content transition-colors cursor-pointer" onClick={onClick}>
            {children}
        </button>
    );
}