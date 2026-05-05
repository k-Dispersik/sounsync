import { createContext, useContext } from "react";
import { useTransport } from "../hooks/useTransport";

type TransportContextType = {
    isPlaying: boolean;
    playheadPosition: number;
    play: () => void;
    pause: () => void;
    stop: () => void;
    setPosition: (ms: number) => void;
};

const TransportContext = createContext<TransportContextType | null>(null);

export default function TransportProvider({ children }: { children: React.ReactNode }) {
    const values = useTransport();

    return (
        <TransportContext.Provider value={values}>
            {children}
        </TransportContext.Provider>
    );
}

export function useTransportContext() {
    const ctx = useContext(TransportContext);
    if (!ctx) {
        throw new Error("useTransport must be used within a TransportProvider");
    }
    return ctx as TransportContextType;
}