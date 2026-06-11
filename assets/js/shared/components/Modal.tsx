interface ModalProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ id, title, children }: ModalProps) {
    return (
        <dialog id={id} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                {children}
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn">Close</button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
}
