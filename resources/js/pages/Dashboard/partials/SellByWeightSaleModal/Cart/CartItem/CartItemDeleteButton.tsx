import { Trash2, Loader } from "lucide-react";

interface CartItemDeleteButtonProps {
    isRemoving: boolean;
    onRemove: () => Promise<void>;
}

export const CartItemDeleteButton = ({ isRemoving, onRemove }: CartItemDeleteButtonProps) => (
    <button
        onClick={onRemove}
        disabled={isRemoving}
        className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 rounded-md shrink-0
            text-red-300 bg-red-50 hover:text-red-500 hover:bg-red-100
            transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
        {isRemoving ? (
            <Loader size={15} className="animate-spin lg:hidden" />
        ) : (
            <Trash2 size={15} className="lg:hidden" />
        )}
        {isRemoving ? (
            <Loader size={12} className="animate-spin hidden lg:block" />
        ) : (
            <Trash2 size={12} className="hidden lg:block" />
        )}
    </button>
);
