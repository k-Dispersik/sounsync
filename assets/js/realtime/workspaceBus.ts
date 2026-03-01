type Handler<T = unknown> = (payload: T) => void;

class WorkspaceBus {
    private handlers: Record<string, Handler[]> = {};

    on<T = unknown>(event: string, handler: Handler<T>): () => void {
        this.handlers[event] ||= [];
        this.handlers[event].push(handler as Handler);
        return () => this.off(event, handler as Handler);
    }

    off(event: string, handler: Handler): void {
        this.handlers[event] = this.handlers[event]?.filter((h) => h !== handler) ?? [];
    }

    emit<T = unknown>(event: string, payload: T): void {
        this.handlers[event]?.forEach((h) => h(payload));
    }
}

export const workspaceBus = new WorkspaceBus();
