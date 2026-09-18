import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useAdjustProductStock } from "@/services/useProductService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { isAxiosError, getUserFacingErrorMessage } from "@/utils/axiosError";
import { IProduct } from "@/models/IProduct";
import { MAX_STOCK_ADJUSTMENT } from "@/utils/stockLimits";
import { isWeightUnit } from "@/utils/weightUnits";
import { integerForUnitTest } from "@/utils/stockAdjustmentValidation";

export type StockAdjustForm = {
    delta: string;
    note: string;
};

// "restock": solo reposición (delta > 0) — negocios no-retail la usan para sumar existencia
// recién comprada. "adjustment": reajuste libre (+/-) — mismo delta que la pestaña "Reajuste"
// de Inventario (retail), para corregir mermas/conteos físicos sin pasar por esa página.
export type StockAdjustMode = "restock" | "adjustment";

// `currentStock` llega en null mientras no hay producto (o variante, si aplica) seleccionado
// — en ese caso se omite el test de suficiencia, ya que `canSubmit` ya bloquea el submit por
// esa razón. Solo aplica a "adjustment": en "restock" el delta siempre es positivo, así que
// nunca puede dejar el stock en negativo. `isWeightProduct` gatea integerForUnitTest — ver su
// doc en utils/stockAdjustmentValidation.ts.
const schemaFor = (mode: StockAdjustMode, currentStock: number | null, isWeightProduct: boolean) =>
    Yup.object({
        delta:
            mode === "restock"
                ? Yup.number()
                      .typeError("Ingresa una cantidad válida")
                      .moreThan(0, "La cantidad debe ser mayor a 0")
                      .max(MAX_STOCK_ADJUSTMENT, `La cantidad no puede ser mayor a ${MAX_STOCK_ADJUSTMENT}`)
                      .required("La cantidad es requerida")
                      .test(integerForUnitTest(isWeightProduct))
                : Yup.number()
                      .typeError("Ingresa una cantidad válida")
                      .notOneOf([0], "La cantidad no puede ser cero")
                      .min(-MAX_STOCK_ADJUSTMENT, `La cantidad no puede ser menor a -${MAX_STOCK_ADJUSTMENT}`)
                      .max(MAX_STOCK_ADJUSTMENT, `La cantidad no puede ser mayor a ${MAX_STOCK_ADJUSTMENT}`)
                      .required("La cantidad es requerida")
                      .test(
                          "sufficient-stock",
                          "Stock insuficiente para esta cantidad",
                          (delta) => currentStock === null || delta === undefined || currentStock + delta >= 0,
                      )
                      .test(integerForUnitTest(isWeightProduct)),
        note: Yup.string().max(255, "Máximo 255 caracteres"),
    });

// El producto a reabastecer/reajustar se selecciona desde la fila de la tabla
// (ProductTableActions) — el modal en sí vive a nivel de página, así que este hook centraliza
// cuál producto está activo y el formulario. Cuando el producto tiene variantes, el stock vive
// en cada una — hay que elegir una antes de poder ajustar (no existe "reposición agregada").
export const useStockAdjustModal = (mode: StockAdjustMode) => {
    const queryClient = useQueryClient();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [variantId, setVariantId] = useState<string>("");
    const { mutateAsync: adjustStock } = useAdjustProductStock();

    const activeVariants = (product?.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;
    const selectedVariant = activeVariants.find((v) => String(v.id) === variantId) ?? null;

    // Fuente única para el schema (test de suficiencia) y para el modal (texto "Stock
    // actual"/mínimo) — con variantes, el stock vive en cada una, no en el producto base.
    const stockable = hasVariants ? selectedVariant : product;
    const currentStock = stockable?.stock !== undefined && stockable?.stock !== null ? parseFloat(stockable.stock) : null;
    const currentMinStock = stockable?.min_stock !== undefined && stockable?.min_stock !== null ? parseFloat(stockable.min_stock) : null;
    // La unidad de medida vive en el producto, no en la variante — todas sus variantes
    // comparten la misma (ej. "pieza"/"paquete" de un producto por unidad).
    const isWeightProduct = product ? isWeightUnit(product.unidad_medida) : false;

    const formik = useFormik<StockAdjustForm>({
        enableReinitialize: true,
        initialValues: { delta: "", note: "" },
        validationSchema: schemaFor(mode, currentStock, isWeightProduct),
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
                // Retail no usa este modal (usa la pestaña "Reajuste" de Inventario), pero si el
                // tenant llega a tener el kardex global visible, que no quede con datos
                // obsoletos por el staleTime de 2 min.
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
                const label = selectedVariant ? `${product.nombre} (${selectedVariant.nombre})` : product.nombre;
                const delta = Number(values.delta);
                toast.success(
                    mode === "restock"
                        ? `Se agregaron ${delta} al stock de "${label}"`
                        : `Se ajustó el stock de "${label}" (${delta > 0 ? "+" : ""}${delta})`,
                );
                helpers.resetForm();
                setProduct(null);
                setVariantId("");
            } catch (error) {
                // Un 422 aquí es InsufficientStockException (ProductController::stockAdjustment)
                // — un rechazo de negocio esperado (alguien más ajustó el stock entre que se
                // abrió el modal y se envió el submit), no una falla real del sistema. Reportarlo
                // como "unexpected" solo ensucia el panel de errores del equipo con ruido que
                // nadie necesita investigar.
                if (!isAxiosError(error) || error.response?.status !== 422) {
                    logUnexpectedError(error, "useStockAdjustModal.onSubmit");
                }
                // Mensaje bajo el input (mismo estilo que un error de Yup), no toast — un error
                // de negocio (ej. "no hay stock suficiente para restar") es específico del
                // campo, no una notificación aparte que el usuario tenga que relacionar de
                // vuelta con el formulario.
                helpers.setFieldError(
                    "delta",
                    getUserFacingErrorMessage(error, mode === "restock" ? "Error al reabastecer el stock" : "Error al ajustar el stock"),
                );
            }
        },
    });

    const openModal = (p: IProduct) => setProduct(p);

    const closeModal = () => {
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
        currentStock,
        currentMinStock,
        formik,
        openModal,
        closeModal,
    };
};
