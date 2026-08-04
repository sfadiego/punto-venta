import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useIndexCategories } from "@/services/useCategoriesService";
import {
    useStoreProduct,
    useUpdateProduct,
    useStoreProductVariant,
    useUpdateProductVariant,
    useDeleteProductVariant,
} from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { useAxios } from "@/hooks/useAxios";
import { IProduct } from "@/models/IProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export type ProductVariantFormValue = {
    id?: number;
    nombre: string;
    precio: string;
};

export type ProductForm = {
    nombre: string;
    descripcion: string;
    precio: string;
    categoria_id: string;
    unidad_medida: UnidadMedidaEnum;
    activo: boolean;
    variants: ProductVariantFormValue[];
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
    variants: Yup.array().of(
        Yup.object({
            nombre: Yup.string().trim().required("El nombre de la variante es requerido").max(100),
            precio: Yup.number()
                .typeError("Ingresa un precio válido")
                .min(0, "El precio no puede ser negativo")
                .required("El precio es requerido"),
        }),
    ),
});

export const useProductModal = (product: IProduct | null, onSuccess: () => void, onClose: () => void) => {
    const isEdit = !!product;
    const { mutateAsync: storeProduct } = useStoreProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct(product?.id ?? 0);
    const { mutateAsync: storeVariant } = useStoreProductVariant();
    const { mutateAsync: updateVariant } = useUpdateProductVariant();
    const { mutateAsync: deleteVariant } = useDeleteProductVariant();
    const { data: categories } = useIndexCategories();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const initialVariants: ProductVariantFormValue[] =
        product?.variants?.map((v) => ({ id: v.id, nombre: v.nombre, precio: v.precio.toString() })) ?? [];

    const formik = useFormik<ProductForm>({
        enableReinitialize: true,
        initialValues: {
            nombre: product?.nombre ?? "",
            descripcion: product?.descripcion ?? "",
            precio: product?.precio?.toString() ?? "",
            categoria_id: product?.categoria_id?.toString() ?? "",
            unidad_medida: product?.unidad_medida ?? (sellByWeight ? UnidadMedidaEnum.Kg : UnidadMedidaEnum.Unidad),
            activo: product?.activo ?? true,
            variants: initialVariants,
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
                let productId = product?.id ?? 0;

                if (isEdit) {
                    await updateProduct(payload);
                    toast.success("Producto actualizado");
                } else {
                    const response = await storeProduct(payload);
                    productId = (response as { data: { data: IProduct } }).data.data.id;
                    toast.success("Producto creado exitosamente");
                }

                // Venta por peso ya resuelve su propio precio variable vía unidad_medida
                // (kg/gr/litro) — no tiene sentido de negocio mezclarlo con variantes de
                // precio fijo, así que el campo ni se muestra ni se sincroniza para estos.
                if (!sellByWeight) {
                    await syncVariants(productId, initialVariants, values.variants, {
                        storeVariant,
                        updateVariant,
                        deleteVariant,
                    });
                }

                if (!isEdit) {
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

const syncVariants = async (
    productId: number,
    initialVariants: ProductVariantFormValue[],
    currentVariants: ProductVariantFormValue[],
    mutations: {
        storeVariant: ReturnType<typeof useStoreProductVariant>["mutateAsync"];
        updateVariant: ReturnType<typeof useUpdateProductVariant>["mutateAsync"];
        deleteVariant: ReturnType<typeof useDeleteProductVariant>["mutateAsync"];
    },
) => {
    const currentIds = new Set(currentVariants.filter((v) => v.id).map((v) => v.id));
    const removed = initialVariants.filter((v) => v.id && !currentIds.has(v.id));

    await Promise.all([
        ...currentVariants.map((variant) => {
            const data = { nombre: variant.nombre.trim(), precio: Number(variant.precio) };
            return variant.id
                ? mutations.updateVariant({ productId, variantId: variant.id, data })
                : mutations.storeVariant({ productId, data });
        }),
        ...removed.map((variant) => mutations.deleteVariant({ productId, variantId: variant.id as number })),
    ]);
};
