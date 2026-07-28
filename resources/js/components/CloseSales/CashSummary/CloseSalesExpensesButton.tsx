import { Eye } from "lucide-react";

interface CloseSalesExpensesButtonProps {
    onClick: () => void;
}

export const CloseSalesExpensesButton = ({ onClick }: CloseSalesExpensesButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className="shrink-0 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
    >
        <Eye size={14} />
        Ver detalle
    </button>
);
