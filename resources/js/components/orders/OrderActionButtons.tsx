import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IOrder } from "@/models/IOrder";
import { useOrderActions } from "./useOrderActions";
import { usePermissions } from "@/hooks/usePermissions";
import { OrderActionGroup, OrderEditControls } from "./OrderActionGroup";

interface OrderActionButtonsProps {
    order: IOrder;
    onSuccess?: () => void;
}

export const OrderActionButtons = ({ order, onSuccess }: OrderActionButtonsProps) => {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const {
        isEditing,
        editedName,
        setEditedName,
        isUpdating,
        isDeleting,
        handleEditStart,
        handleEditConfirm,
        handleEditCancel,
        handleKeyDown,
        handleDelete,
    } = useOrderActions(order, onSuccess);

    if (isEditing) {
        return (
            <div
                className="flex items-center gap-1.5 w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    autoFocus
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 text-xs font-medium text-stone-900 bg-white border border-amber-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
                <OrderEditControls
                    isUpdating={isUpdating}
                    onConfirm={handleEditConfirm}
                    onCancel={handleEditCancel}
                />
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            {can("takeOrder") && (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/take-order/${order.id}`); }}
                    title="Ver orden"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                >
                    <ExternalLink size={20} />
                </button>
            )}

            <OrderActionGroup
                order={order}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                onSuccess={onSuccess}
            />
        </div>
    );
};
