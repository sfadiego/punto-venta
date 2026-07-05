import { IOrder } from "@/models/IOrder";
import { Clock, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStatusStyle, getStatusLabel, formatOrderTime } from "../useDashboard";
import { useOrderActions } from "@/components/orders/useOrderActions";
import { usePermissions } from "@/hooks/usePermissions";
import { OrderActionGroup, OrderEditControls } from "@/components/orders/OrderActionGroup";

interface OrderCardProps {
    order: IOrder;
}

export const OrderCard = ({ order }: OrderCardProps) => {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const statusNombre = getStatusLabel(order.estatus_pedido_id);

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
    } = useOrderActions(order);

    const canNavigate = can("takeOrder") && !isEditing;

    return (
        <div
            onClick={() => canNavigate && navigate(`/take-order/${order.id}`)}
            className={`flex flex-col gap-2 px-4 py-3 rounded-xl bg-stone-50 transition-colors sm:flex-row sm:items-center sm:gap-3 ${canNavigate ? "hover:bg-stone-100 cursor-pointer" : "cursor-default"}`}
        >
            {/* Fila superior: icono + nombre + tiempo/estado */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Receipt size={20} className="text-stone-400" />
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            autoFocus
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm font-semibold text-stone-900 bg-white border border-amber-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-amber-300"
                        />
                    ) : (
                        <p className="text-sm font-semibold text-stone-900 truncate">
                            {order.nombre_pedido}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Clock size={13} />
                            {formatOrderTime(order.created_at)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.estatus_pedido_id)}`}>
                            {statusNombre}
                        </span>
                    </div>
                </div>
            </div>

            {/* Fila inferior en móvil / misma fila en desktop: total + botones */}
            <div
                className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-sm font-bold text-stone-900 tabular-nums shrink-0">
                    ${order.total.toFixed(2)}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                        <OrderEditControls
                            isUpdating={isUpdating}
                            onConfirm={handleEditConfirm}
                            onCancel={handleEditCancel}
                        />
                    ) : (
                        <OrderActionGroup
                            order={order}
                            onEditStart={handleEditStart}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                            showPrintLabel
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
