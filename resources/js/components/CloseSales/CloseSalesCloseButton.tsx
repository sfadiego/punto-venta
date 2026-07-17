import { Lock } from "lucide-react";

interface CloseSalesCloseButtonProps {
    isClosing: boolean;
    disabled: boolean;
    onClick: () => void;
}

export const CloseSalesCloseButton = ({ isClosing, disabled, onClick }: CloseSalesCloseButtonProps) => (
    <button
        onClick={onClick}
        disabled={isClosing || disabled}
        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors text-sm"
    >
        <Lock size={16} />
        {isClosing ? "Cerrando caja..." : "Cerrar caja"}
    </button>
);
