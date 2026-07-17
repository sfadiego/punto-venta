import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IOrder } from "@/models/IOrder";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useUpdateOrder, useDeleteOrder } from "@/services/useOrderService";

export const useOrderActions = (order: IOrder, onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(order.nombre_pedido);

    const { mutateAsync: updateOrder, isPending: isUpdating } = useUpdateOrder(order.id);
    const { mutateAsync: deleteOrder, isPending: isDeleting } = useDeleteOrder(order.id);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        onSuccess?.();
    };

    const confirmEdit = async () => {
        const trimmed = editedName.trim();
        if (!trimmed) return;
        await updateOrder({ nombre_pedido: trimmed });
        invalidate();
        setIsEditing(false);
        toast.success("Nombre de orden actualizado");
    };

    const handleEditStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditedName(order.nombre_pedido);
        setIsEditing(true);
    };

    const handleEditConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        confirmEdit();
    };

    const handleEditCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditedName(order.nombre_pedido);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === "Enter") confirmEdit();
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditedName(order.nombre_pedido);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: "¿Eliminar orden?",
            text: `La orden "${order.nombre_pedido}" se eliminará de forma permanente.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteOrder({});
        invalidate();
        toast.success("Orden eliminada");
    };

    return {
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
    };
};
