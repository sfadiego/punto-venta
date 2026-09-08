import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IProduct } from "@/models/IProduct";
import { useIndexProducts, useShowProduct, useAdjustProductStock } from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { MAX_STOCK_ADJUSTMENT } from "@/utils/stockLimits";

export type StockAdjustmentForm = {
    delta: string;
    note: string;
};

const schema = Yup.object({
    delta: Yup.number()
        .typeError("Ingresa una cantidad válida")
        .notOneOf([0], "La cantidad no puede ser cero")
        .min(-MAX_STOCK_ADJUSTMENT, `La cantidad no puede ser menor a -${MAX_STOCK_ADJUSTMENT}`)
        .max(MAX_STOCK_ADJUSTMENT, `La cantidad no puede ser mayor a ${MAX_STOCK_ADJUSTMENT}`)
        .required("La cantidad es requerida"),
    note: Yup.string().max(255, "Máximo 255 caracteres"),
});

// A diferencia de RestockModal (pages/Product), este modal no se abre desde una fila de
// tabla — el producto se busca y selecciona en un único combobox (input + sugerencias
// desplegables, ver ProductAutocomplete), y el delta admite valores negativos (mermas), no
// solo reposición.
export const useStockAdjustmentModal = () => {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [productId, setProductId] = useState<number | null>(null);
    const [variantId, setVariantId] = useState<string>("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: productsPage } = useIndexProducts({
        nombre: debouncedQuery || undefined,
        limit: 20,
        enabled: isOpen,
    });
    const suggestions = (productsPage?.data ?? []).filter((p) => p.manage_stock);

    const { data: product } = useShowProduct(productId ?? 0, isOpen);
    const { mutateAsync: adjustStock } = useAdjustProductStock();

    const activeVariants = (product?.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;
    const selectedVariant = activeVariants.find((v) => String(v.id) === variantId) ?? null;
    const canSubmit = !!product && (!hasVariants || !!selectedVariant);

    const formik = useFormik<StockAdjustmentForm>({
        enableReinitialize: true,
        initialValues: { delta: "", note: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!canSubmit || !product) return;

            try {
                await adjustStock({
                    productId: product.id,
                    data: {
                        delta: Number(values.delta),
                        note: values.note.trim() || undefined,
                        ...(selectedVariant ? { variant_id: selectedVariant.id } : {}),
                    },
                });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
                const label = selectedVariant ? `${product.nombre} (${selectedVariant.nombre})` : product.nombre;
                toast.success(`Se ajustó el stock de "${label}"`);
                helpers.resetForm();
                closeModal();
            } catch (error) {
                logUnexpectedError(error, "useStockAdjustmentModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al ajustar el stock"));
            }
        },
    });

    // Escribir invalida la selección previa (ya no corresponde a lo que se ve en el input)
    // y reabre el desplegable de sugerencias.
    const handleQueryChange = (value: string) => {
        setQuery(value);
        setProductId(null);
        setVariantId("");
        setIsDropdownOpen(true);
    };

    const selectProduct = (selected: IProduct) => {
        setQuery(selected.nombre);
        setProductId(selected.id);
        setVariantId("");
        setIsDropdownOpen(false);
    };

    const openModal = () => setIsOpen(true);

    const closeModal = () => {
        formik.resetForm();
        setIsOpen(false);
        setQuery("");
        setDebouncedQuery("");
        setIsDropdownOpen(false);
        setProductId(null);
        setVariantId("");
    };

    return {
        isOpen,
        query,
        handleQueryChange,
        suggestions,
        isDropdownOpen,
        setIsDropdownOpen,
        product: product ?? null,
        selectProduct,
        hasVariants,
        activeVariants,
        variantId,
        setVariantId,
        selectedVariant,
        canSubmit,
        formik,
        openModal,
        closeModal,
    };
};
