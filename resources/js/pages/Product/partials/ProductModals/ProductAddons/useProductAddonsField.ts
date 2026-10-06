import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { FormikProps } from "formik";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { IAddon } from "@/models/IAddon";
import { RoleEnum } from "@/enums/RoleEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { invalidateAddonQueries, useAddonList, useStoreAddon } from "@/services/useAddonService";
import { canCreateAddon, filterAddonsByQuery } from "@/utils/addonUtils";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ProductForm } from "../useProductModal";

export const MAX_VISIBLE_ADDON_CHIPS = 6;

/**
 * Lógica del campo "Toppings" del formulario de producto: selección múltiple con buscador.
 * Lo asignado vive en formik (addon_ids, como strings igual que branch_ids); el catálogo sale
 * de la lista liviana de toppings activos. Los toppings del producto que ya no están activos
 * se resuelven desde productAddons para que sigan viéndose como chips.
 */
export const useProductAddonsField = (formik: FormikProps<ProductForm>, productAddons: IAddon[]) => {
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();
    const { data, isLoading } = useAddonList();
    const { mutateAsync: storeAddon } = useStoreAddon();

    const [query, setQuery] = useState("");
    // El buscador no está siempre visible: se abre desde la tarjeta vacía o la píldora "+ Agregar".
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [chipsExpanded, setChipsExpanded] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const isCreatingRef = useRef(false);

    const catalog = useMemo(() => data ?? [], [data]);
    const selectedIds = formik.values.addon_ids;

    const selected = useMemo(() => {
        const byId = new Map<number, IAddon>();
        [...productAddons, ...catalog].forEach((addon) => byId.set(addon.id, addon));
        return selectedIds.map((id) => byId.get(Number(id))).filter((addon): addon is IAddon => Boolean(addon));
    }, [productAddons, catalog, selectedIds]);

    const filtered = useMemo(() => filterAddonsByQuery(catalog, query), [catalog, query]);
    // Crear toppings es exclusivo del Admin (POST /addon va con role.admin en el backend).
    const canCreateAddons = hasRole(RoleEnum.Admin);
    const showCreate = canCreateAddons && canCreateAddon(catalog, query);
    const optionCount = filtered.length + (showCreate ? 1 : 0);

    const toggle = (id: number) => {
        const key = String(id);
        formik.setFieldValue(
            "addon_ids",
            selectedIds.includes(key) ? selectedIds.filter((selectedId) => selectedId !== key) : [...selectedIds, key],
        );
    };

    const createAddon = async () => {
        const name = query.trim();
        if (!name || isCreatingRef.current) return;
        isCreatingRef.current = true;
        setIsCreating(true);
        try {
            const response = await storeAddon({ name });
            const created = response.data.data;
            formik.setFieldValue("addon_ids", [...selectedIds, String(created.id)]);
            invalidateAddonQueries(queryClient);
            toast.success(`Topping "${created.name}" creado sin costo. Su precio se edita en el catálogo de toppings.`);
            setQuery("");
            setActiveIndex(0);
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (fieldErrors) {
                toast.error(Object.values(fieldErrors)[0]);
            } else {
                logUnexpectedError(error, "useProductAddonsField.createAddon");
                toast.error(getUserFacingErrorMessage(error, "Error al crear el topping"));
            }
        } finally {
            isCreatingRef.current = false;
            setIsCreating(false);
        }
    };

    const activateOption = (index: number) => {
        if (index < filtered.length) {
            toggle(filtered[index].id);
        } else if (showCreate) {
            createAddon();
        }
    };

    const startSearching = () => setIsSearching(true);

    const stopSearching = () => {
        setIsSearching(false);
        setQuery("");
        setActiveIndex(0);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setActiveIndex(0);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, Math.max(optionCount - 1, 0)));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            // Evita enviar el formulario de producto al confirmar una opción.
            event.preventDefault();
            if (optionCount > 0) activateOption(activeIndex);
        } else if (event.key === "Escape") {
            stopSearching();
        } else if (event.key === "Backspace" && query === "" && selectedIds.length > 0) {
            formik.setFieldValue("addon_ids", selectedIds.slice(0, -1));
        }
    };

    return {
        isLoading,
        isCreating,
        isSearching,
        startSearching,
        stopSearching,
        canCreateAddons,
        query,
        handleQueryChange,
        handleKeyDown,
        activeIndex,
        selected,
        selectedIds,
        chipsExpanded,
        toggleChipsExpanded: () => setChipsExpanded((expanded) => !expanded),
        filtered,
        showCreate,
        toggle,
        createAddon,
        activateOption,
        catalogSize: catalog.length,
    };
};
