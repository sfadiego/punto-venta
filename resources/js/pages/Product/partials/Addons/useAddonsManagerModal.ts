import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IAddon } from "@/models/IAddon";
import { useModal } from "@/hooks/useModal";
import { invalidateAddonQueries, useDeleteAddon, useIndexAddonsPaginated } from "@/services/useAddonService";
import { filterAddonsByQuery } from "@/utils/addonUtils";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { logUnexpectedError } from "@/plugins/logger.plugin";

// Sin paginación en pantalla: el catálogo de toppings de un negocio cabe de sobra en una carga.
const CATALOG_LIMIT = 500;

export const useAddonsManagerModal = (isOpen: boolean) => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useIndexAddonsPaginated({ limit: CATALOG_LIMIT, enabled: isOpen });
    const { mutateAsync: deleteAddon } = useDeleteAddon();
    const detailModal = useModal();

    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [editingAddon, setEditingAddon] = useState<IAddon | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const isDeletingRef = useRef(false);

    const addons = useMemo(() => data?.data ?? [], [data]);
    const filteredAddons = useMemo(() => filterAddonsByQuery(addons, search), [addons, search]);
    // Si el topping seleccionado ya no está en el catálogo (borrado), el panel se oculta solo.
    const selectedAddon = addons.find((addon) => addon.id === selectedId) ?? null;

    const openCreate = () => {
        setEditingAddon(null);
        detailModal.openModal();
    };

    const openEdit = (addon: IAddon) => {
        setEditingAddon(addon);
        detailModal.openModal();
    };

    // Al guardar un topping se deja seleccionado para asignarlo a productos de inmediato.
    const handleSaved = (addon: IAddon) => setSelectedId(addon.id);

    const handleDelete = async (addon: IAddon) => {
        if (isDeletingRef.current) return;

        const result = await Swal.fire({
            title: "¿Eliminar topping?",
            text: `"${addon.name}" dejará de ofrecerse en todos sus productos. Los pedidos anteriores conservan su nombre y precio. Si solo quieres pausarlo, desactívalo en su lugar.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        isDeletingRef.current = true;
        setDeletingId(addon.id);
        try {
            await deleteAddon(addon.id);
            invalidateAddonQueries(queryClient);
            toast.success("Topping eliminado");
            if (selectedId === addon.id) setSelectedId(null);
        } catch (error) {
            logUnexpectedError(error, "useAddonsManagerModal.handleDelete");
            toast.error(getUserFacingErrorMessage(error, "Error al eliminar el topping"));
        } finally {
            isDeletingRef.current = false;
            setDeletingId(null);
        }
    };

    return {
        isLoading,
        search,
        setSearch,
        addons,
        filteredAddons,
        selectedId,
        selectedAddon,
        setSelectedId,
        editingAddon,
        isDetailOpen: detailModal.isOpen,
        closeDetail: detailModal.closeModal,
        openCreate,
        openEdit,
        handleSaved,
        handleDelete,
        deletingId,
    };
};
