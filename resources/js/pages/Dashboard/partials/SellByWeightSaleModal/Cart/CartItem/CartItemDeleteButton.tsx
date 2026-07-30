import { Trash2, Loader } from "lucide-react";

interface CartItemDeleteButtonProps {
    isRemoving: boolean;
    onRemove: () => Promise<void>;
}

export const CartItemDeleteButton = ({ isRemoving, onRemove }: CartItemDeleteButtonProps) => (
    <button
        onClick={onRemove}
        disabled={isRemoving}
        className="flex items-center justify-center w-8 h-8 sm:w-6 sm:h-6 rounded-md
            text-red-300 bg-red-50 hover:text-red-500 hover:bg-red-100
            transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
        {isRemoving ? (
            <Loader size={15} className="animate-spin sm:hidden" />
        ) : (
            <Trash2 size={15} className="sm:hidden" />
        )}
        {isRemoving ? (
            <Loader size={12} className="animate-spin hidden sm:block" />
        ) : (
            <Trash2 size={12} className="hidden sm:block" />
        )}
    </button>
);
