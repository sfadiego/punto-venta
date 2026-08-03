import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useStoreProduct, useUpdateProduct } from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { useAxios } from "@/hooks/useAxios";
import { IProduct } from "@/models/IProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export type ProductForm = {
    nombre: string;
    descripcion: string;
    precio: string;
    categoria_id: string;
    unidad_medida: UnidadMedidaEnum;
    activo: boolean;
};

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    descripcion: Yup.string(),
    precio: Yup.number()
        .typeError("Ingresa un precio válido")
        .min(0, "El precio no puede ser negativo")
        .required("El precio es requerido"),
    categoria_id: Yup.string().required("La categoría es requerida"),
    unidad_medida: Yup.string().required(),
    activo: Yup.boolean(),
});

export const useProductModal = (product: IProduct | null, onSuccess: () => void, onClose: () => void) => {
    const isEdit = !!product;
    const { mutateAsync: storeProduct } = useStoreProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct(product?.id ?? 0);
    const { data: categories } = useIndexCategories();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const formik = useFormik<ProductForm>({
        enableReinitialize: true,
        initialValues: {
            nombre: product?.nombre ?? "",
            descripcion: product?.descripcion ?? "",
            precio: product?.precio?.toString() ?? "",
            categoria_id: product?.categoria_id?.toString() ?? "",
            unidad_medida: product?.unidad_medida ?? (sellByWeight ? UnidadMedidaEnum.Kg : UnidadMedidaEnum.Unidad),
            activo: product?.activo ?? true,
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const payload = {
                nombre: values.nombre.trim(),
                descripcion: values.descripcion.trim(),
                precio: Number(values.precio),
                categoria_id: Number(values.categoria_id),
                unidad_medida: values.unidad_medida,
                activo: values.activo,
            };

            try {
                if (isEdit) {
                    await updateProduct(payload);
                    toast.success("Producto actualizado");
                } else {
                    await storeProduct(payload);
                    toast.success("Producto creado exitosamente");
                    helpers.resetForm();
                }
                onSuccess();
                onClose();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useProductModal.onSubmit");
                    toast.error(getUserFacingErrorMessage(error, `Error al ${isEdit ? "actualizar" : "crear"} el producto`));
                }
            }
        },
    });

    return {
        isEdit,
        formik,
        categories: categories ?? [],
        sellByWeight,
    };
};
