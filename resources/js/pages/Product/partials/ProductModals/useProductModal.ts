import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useBranchList } from "@/services/useBranchService";
import {
    useStoreProduct,
    useUpdateProduct,
    useStoreProductVariant,
    useUpdateProductVariant,
    useDeleteProductVariant,
} from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { capitalizeFirstLetter } from "@/utils/textCase";
import { useAxios } from "@/hooks/useAxios";
import { IProduct } from "@/models/IProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { trimDecimalZeros } from "@/utils/formatDecimal";

export type ProductVariantFormValue = {
    id?: number;
    nombre: string;
    precio: string;
    stock: string;
    min_stock: string;
};

export type ProductForm = {
    nombre: string;
    descripcion: string;
    precio: string;
    categoria_id: string;
    unidad_medida: UnidadMedidaEnum;
    activo: boolean;
    variants: ProductVariantFormValue[];
    manage_stock: boolean;
    stock: string;
    min_stock: string;
    product_code: string;
    icon_name: string;
    icon_source: IconSourceEnum;
    /** Vacío = disponible en todas las sucursales (ver ProductBranchesField). */
    branch_ids: string[];
};

const baseSchema = {
    nombre: Yup.string().trim().required("El nombre es requerido").max(70, "Máximo 70 caracteres"),
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
            nombre: Yup.string().trim().required("El nombre de la variante es requerido").max(70, "Máximo 70 caracteres"),
            precio: Yup.number()
                .typeError("Ingresa un precio válido")
                .min(0, "El precio no puede ser negativo")
                .required("El precio es requerido"),
            // Las variantes solo existen para unidad_medida "unidad" (ver syncVariants) — su
            // stock siempre se cuenta en piezas, nunca decimal.
            stock: Yup.number()
                .typeError("Ingresa un stock inicial válido")
                .min(0, "El stock inicial no puede ser negativo")
                .integer("El stock inicial no acepta decimales")
                .nullable(),
            min_stock: Yup.number()
                .typeError("Ingresa un stock mínimo válido")
                .min(0, "El stock mínimo no puede ser negativo")
                .integer("El stock mínimo no acepta decimales")
                .nullable(),
        }),
    ),
    manage_stock: Yup.boolean(),
    // Decimal solo tiene sentido de negocio cuando el producto se vende por peso/volumen
    // (kg/gr/litro) — un producto por "unidad" se cuenta en piezas.
    stock: Yup.number()
        .typeError("Ingresa un stock inicial válido")
        .min(0, "El stock inicial no puede ser negativo")
        .test("integer-if-unit", "El stock inicial no acepta decimales", function (value) {
            const { unidad_medida } = this.parent as { unidad_medida?: UnidadMedidaEnum };
            return value === undefined || value === null || unidad_medida !== UnidadMedidaEnum.Unidad || Number.isInteger(value);
        })
        .nullable(),
    min_stock: Yup.number()
        .typeError("Ingresa un stock mínimo válido")
        .min(0, "El stock mínimo no puede ser negativo")
        .test("integer-if-unit", "El stock mínimo no acepta decimales", function (value) {
            const { unidad_medida } = this.parent as { unidad_medida?: UnidadMedidaEnum };
            return value === undefined || value === null || unidad_medida !== UnidadMedidaEnum.Unidad || Number.isInteger(value);
        })
        .nullable(),
    product_code: Yup.string().max(64, "Máximo 64 caracteres"),
    icon_name: Yup.string().max(100, "Máximo 100 caracteres"),
    icon_source: Yup.mixed<IconSourceEnum>().oneOf(Object.values(IconSourceEnum)),
};

export const useProductModal = (product: IProduct | null, onSuccess: () => void, onClose: () => void) => {
    const isEdit = !!product;
    const { mutateAsync: storeProduct } = useStoreProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct(product?.id ?? 0);
    const { mutateAsync: storeVariant } = useStoreProductVariant();
    const { mutateAsync: updateVariant } = useUpdateProductVariant();
    const { mutateAsync: deleteVariant } = useDeleteProductVariant();
    const { data: categories } = useIndexCategories();
    const { features } = useAxios();
    const { data: businessConfig } = useGetBusinessConfig();
    // Tenant sin la feature de sucursales: siempre devuelve []. Con la feature activa,
    // trae solo las sucursales autorizadas para este usuario (ver useBranchService.ts).
    const { data: branches } = useBranchList();
    // El checklist solo se muestra cuando el usuario tiene más de una sucursal autorizada
    // — con una sola (o cero, tenant sin la feature), "todas" y "esa sucursal" son
    // equivalentes en la práctica, así que el campo ni se muestra ni se envía.
    const showBranchSelector = (branches?.length ?? 0) > 1;
    const schema = useMemo(() => Yup.object({
        ...baseSchema,
        branch_ids: Yup.array().of(Yup.string()),
    }), []);
    const sellByWeight = features?.sell_by_weight === true;
    // Bandera por tenant (business_config.stock_enabled, gestionada desde SuperAdmin) — no
    // depende del tipo de negocio: reemplaza el bloqueo anterior que deshabilitaba "Maneja
    // stock" para todo negocio tipo restaurante sin excepción.
    const stockEnabled = businessConfig?.stock_enabled === true;

    // stock nunca se prellena al editar (mismo criterio que el stock a nivel producto):
    // una variante existente solo se ajusta vía reposición, nunca reescribiendo el valor.
    const initialVariants: ProductVariantFormValue[] =
        product?.variants?.map((v) => ({
            id: v.id,
            nombre: v.nombre,
            precio: v.precio.toString(),
            stock: "",
            min_stock: v.min_stock ? trimDecimalZeros(v.min_stock) : "",
        })) ?? [];

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
            manage_stock: product?.manage_stock ?? false,
            stock: "",
            min_stock: product?.min_stock ? trimDecimalZeros(product.min_stock) : "",
            product_code: product?.product_code ?? "",
            icon_name: product?.icon_name ?? "",
            icon_source: product?.icon_source ?? IconSourceEnum.Openmoji,
            branch_ids: product?.branches?.map((b) => String(b.id)) ?? [],
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const payload: Record<string, unknown> = {
                nombre: capitalizeFirstLetter(values.nombre),
                descripcion: values.descripcion.trim(),
                precio: Number(values.precio),
                categoria_id: Number(values.categoria_id),
                unidad_medida: values.unidad_medida,
                activo: values.activo,
                manage_stock: values.manage_stock,
                product_code: values.product_code.trim() || undefined,
                icon_name: values.icon_name.trim(),
                icon_source: values.icon_source,
                // Solo se envía si el checklist está visible (2+ sucursales autorizadas) —
                // con 0-1 no hay nada que restringir y el backend no espera el campo.
                ...(showBranchSelector ? { branch_ids: values.branch_ids.map(Number) } : {}),
            };

            // El stock inicial se puede capturar al crear, o al activar "Maneja stock" por
            // primera vez sobre un producto existente (antes no lo manejaba) — en ambos casos
            // no hay historial que proteger todavía. Si el producto YA manejaba stock, no se
            // reenvía: se ajusta solo vía StockService::adjust (auditado), nunca reescribiendo
            // el valor directo.
            const isFreshStockActivation = !product?.manage_stock;
            if (values.manage_stock) {
                payload.min_stock = values.min_stock !== "" ? Number(values.min_stock) : undefined;
                if (isFreshStockActivation) {
                    payload.stock = values.stock !== "" ? Number(values.stock) : undefined;
                }
            }

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

                // Las variantes de precio fijo solo aplican a productos con unidad_medida
                // "unidad" — un producto por kg/gr/litro ya resuelve su precio variable vía
                // báscula y no tiene sentido de negocio mezclarlo con variantes.
                if (values.unidad_medida === UnidadMedidaEnum.Unidad) {
                    await syncVariants(productId, initialVariants, values.variants, values.manage_stock, {
                        storeVariant,
                        updateVariant,
                        deleteVariant,
                    });
                }

                helpers.resetForm();
                onSuccess();
                onClose();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                    // branch_ids no siempre está visible (checklist oculto con 0-1 sucursales
                    // autorizadas) — si el backend lo rechaza igual, setErrors no pinta nada en
                    // pantalla y el usuario ve un fallo silencioso. Forzar un toast para ese caso.
                    const branchError = Object.entries(fieldErrors).find(([key]) => key.startsWith("branch_ids"));
                    if (branchError && !showBranchSelector) {
                        toast.error(branchError[1]);
                    }
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
        stockEnabled,
        currentStock: product?.stock ?? null,
        showBranchSelector,
    };
};

const syncVariants = async (
    productId: number,
    initialVariants: ProductVariantFormValue[],
    currentVariants: ProductVariantFormValue[],
    manageStock: boolean,
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
            const data: Record<string, unknown> = { nombre: variant.nombre.trim(), precio: Number(variant.precio) };

            // min_stock siempre se puede editar; el stock inicial solo aplica a variantes
            // nuevas (sin id) — igual que el criterio de "carga inicial" a nivel producto.
            if (manageStock) {
                data.min_stock = variant.min_stock !== "" ? Number(variant.min_stock) : undefined;
                if (!variant.id) {
                    data.stock = variant.stock !== "" ? Number(variant.stock) : undefined;
                }
            }

            return variant.id
                ? mutations.updateVariant({ productId, variantId: variant.id, data })
                : mutations.storeVariant({ productId, data });
        }),
        ...removed.map((variant) => mutations.deleteVariant({ productId, variantId: variant.id as number })),
    ]);
};
