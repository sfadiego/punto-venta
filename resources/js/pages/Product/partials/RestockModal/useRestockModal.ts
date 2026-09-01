import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useAdjustProductStock } from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { IProduct } from "@/models/IProduct";

export type RestockForm = {
    delta: string;
    note: string;
};

const schema = Yup.object({
    delta: Yup.number()
        .typeError("Ingresa una cantidad válida")
        .moreThan(0, "La cantidad debe ser mayor a 0")
        .required("La cantidad es requerida"),
    note: Yup.string().max(255, "Máximo 255 caracteres"),
});

// El producto a reabastecer se selecciona desde la fila de la tabla (ProductTableActions) —
// el modal en sí vive a nivel de página, así que este hook centraliza cuál producto está
// activo y el formulario de ajuste. Cuando el producto tiene variantes, el stock vive en
// cada una — hay que elegir una antes de poder ajustar (no existe "reposición agregada").
export const useRestockModal = () => {
    const queryClient = useQueryClient();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [variantId, setVariantId] = useState<string>("");
    const { mutateAsync: adjustStock } = useAdjustProductStock();

    const activeVariants = (product?.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;
    const selectedVariant = activeVariants.find((v) => String(v.id) === variantId) ?? null;

    const formik = useFormik<RestockForm>({
        enableReinitialize: true,
        initialValues: { delta: "", note: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!product || (hasVariants && !selectedVariant)) return;

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
                const label = selectedVariant ? `${product.nombre} (${selectedVariant.nombre})` : product.nombre;
                toast.success(`Se agregaron ${values.delta} al stock de "${label}"`);
                helpers.resetForm();
                setProduct(null);
                setVariantId("");
            } catch (error) {
                logUnexpectedError(error, "useRestockModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al reabastecer el stock"));
            }
        },
    });

    const openRestockModal = (p: IProduct) => setProduct(p);

    const closeRestockModal = () => {
        formik.resetForm();
        setProduct(null);
        setVariantId("");
    };

    return {
        isOpen: !!product,
        product,
        hasVariants,
        activeVariants,
        variantId,
        setVariantId,
        selectedVariant,
        formik,
        openRestockModal,
        closeRestockModal,
    };
};
