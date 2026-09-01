import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";
import { IProductVariant } from "@/models/IProductVariant";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { ProductForm } from "./useProductModal";
import { ProductModalHeader } from "./ProductModalHeader";
import { ProductPricingFields } from "./ProductPricingFields";
import { ProductVariantsTrigger } from "./ProductVariantsTrigger";
import { UnidadMedidaField } from "./UnidadMedidaField";
import { ProductAvailabilityToggle } from "./ProductAvailabilityToggle";
import { ProductStockToggle } from "./ProductStockToggle";
import { ProductStockFields } from "./ProductStockFields";
import { ProductCodeField } from "./ProductCodeField";
import { ProductIconField } from "./ProductIconField";
import { ProductModalFooter } from "./ProductModalFooter";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";

interface ProductModalProps {
    isOpen: boolean;
    isEdit: boolean;
    formik: FormikProps<ProductForm>;
    categories: ICategory[];
    sellByWeight: boolean;
    stockEnabled: boolean;
    currentStock?: string | null;
    productVariants: IProductVariant[];
    onClose: () => void;
}

export const ProductModal = ({
    isOpen,
    isEdit,
    formik,
    categories,
    sellByWeight,
    stockEnabled,
    currentStock,
    productVariants,
    onClose,
}: ProductModalProps) => {
    if (!isOpen) return null;

    const hasVariants = formik.values.variants.length > 0;
    // Las variantes de precio fijo solo aplican a productos con unidad_medida "unidad" — un
    // producto por kg/gr/litro ya resuelve su precio variable vía báscula.
    const canUseVariants = formik.values.unidad_medida === UnidadMedidaEnum.Unidad;
    // manage_stock=true siempre implica stock no-null (ver ProductModel::updateProduct) — así
    // que currentStock no-null es equivalente a "el producto ya manejaba stock antes de abrir
    // este modal", sin necesitar una prop nueva solo para eso.
    const wasManagingStock = currentStock !== null && currentStock !== undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <ProductModalHeader isEdit={isEdit} nombre={formik.values.nombre} onClose={onClose} />

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8">
                            <Input<ProductForm>
                                name="nombre"
                                label="Nombre *"
                                formik={formik}
                                placeholder={sellByWeight ? "Ej: Lomo de res" : "Ej: Café americano"}
                                maxLength={255}
                            />
                        </div>
                        <div className="col-span-4">
                            <ProductCodeField formik={formik} />
                        </div>
                    </div>

                    <Textarea<ProductForm>
                        name="descripcion"
                        label="Descripción"
                        placeholder="Descripción del producto (opcional)"
                        formik={formik}
                        rows={2}
                    />

                    <div className="grid grid-cols-[1fr_1.4fr] gap-3 items-start">
                        <ProductIconField formik={formik} />
                        <ProductAvailabilityToggle formik={formik} />
                    </div>

                    <ProductPricingFields formik={formik} categories={categories} />

                    {sellByWeight && <UnidadMedidaField formik={formik} />}

                    {/* En negocios de venta por peso, un producto puntual con unidad_medida
                        "unidad" puede vender por pieza suelta además de su precio base (ej.
                        Chorizo: bolsa a precio normal + variante "Pieza") — mismo campo de
                        variantes que ya usan los negocios tipo restaurante, sin duplicar UI.
                        Si el producto maneja stock, cada variante lleva su propia existencia
                        (ej. tallas de un zapato) en vez del stock a nivel producto. La gestión
                        vive en su propio modal (ProductVariantsModal) para no hacer crecer este
                        formulario — el trigger solo abre/cierra esa ventana.
                        stockEnabled es business_config.stock_enabled (bandera por tenant
                        gestionada desde SuperAdmin) — si el negocio no tiene stock habilitado,
                        el toggle ni se muestra en vez de mostrarlo deshabilitado. Cuando ambas
                        secciones aplican se muestran en una sola fila para ahorrar espacio. */}
                    {(canUseVariants || stockEnabled) && (
                        <div className={canUseVariants && stockEnabled ? "grid grid-cols-2 gap-3" : undefined}>
                            {canUseVariants && (
                                <ProductVariantsTrigger
                                    formik={formik}
                                    manageStock={formik.values.manage_stock}
                                    productVariants={productVariants}
                                />
                            )}
                            {stockEnabled && <ProductStockToggle formik={formik} />}
                        </div>
                    )}

                    {/* Con variantes, el stock vive en cada una (ver ProductVariantsModal) — los
                        inputs de stock a nivel producto no aplican en ese caso. */}
                    {stockEnabled && !hasVariants && (
                        <ProductStockFields
                            formik={formik}
                            isEdit={isEdit}
                            wasManagingStock={wasManagingStock}
                            currentStock={currentStock}
                        />
                    )}

                    <ProductModalFooter isEdit={isEdit} isSubmitting={formik.isSubmitting} onClose={onClose} />
                </form>
            </div>
        </div>
    );
};
