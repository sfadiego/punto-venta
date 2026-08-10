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
// activo y el formulario de ajuste.
export const useRestockModal = () => {
    const queryClient = useQueryClient();
    const [product, setProduct] = useState<IProduct | null>(null);
    const { mutateAsync: adjustStock } = useAdjustProductStock();

    const formik = useFormik<RestockForm>({
        enableReinitialize: true,
        initialValues: { delta: "", note: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!product) return;

            try {
                await adjustStock({
                    productId: product.id,
                    data: { delta: Number(values.delta), note: values.note.trim() || undefined },
                });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
                toast.success(`Se agregaron ${values.delta} al stock de "${product.nombre}"`);
                helpers.resetForm();
                setProduct(null);
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
    };

    return {
        isOpen: !!product,
        product,
        formik,
        openRestockModal,
        closeRestockModal,
    };
};
