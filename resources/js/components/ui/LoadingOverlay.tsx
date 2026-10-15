import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    visible: boolean;
    text?: string;
    className?: string;
}

// Cubre al contenedor padre (que debe ser `relative`) con un velo y un spinner mientras `visible`.
export const LoadingOverlay = ({ visible, text = "Cargando...", className = "" }: LoadingOverlayProps) => {
    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/70 backdrop-blur-[1px] ${className}`}
        >
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <span className="text-sm font-medium text-stone-500">{text}</span>
        </div>
    );
};
