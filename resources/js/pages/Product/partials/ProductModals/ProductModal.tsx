import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { ProductForm } from "./useProductModal";
import { ProductModalHeader } from "./ProductModalHeader";
import { ProductPricingFields } from "./ProductPricingFields";
import { ProductVariantsField } from "./ProductVariantsField";
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
    onClose,
}: ProductModalProps) => {
    if (!isOpen) return null;

    const hasVariants = formik.values.variants.length > 0;
    // Una venta por variante no descuenta stock — no tiene sentido de negocio combinarlas con
    // manage_stock en el mismo producto (ver ProductVariantStoreRequest/ProductUpdateRequest,
    // que bloquean esta combinación en ambos sentidos también del lado del backend).
    const canUseVariants = formik.values.unidad_medida === UnidadMedidaEnum.Unidad && !formik.values.manage_stock;
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
                    <Input<ProductForm>
                        name="nombre"
                        label="Nombre *"
                        formik={formik}
                        placeholder={sellByWeight ? "Ej: Lomo de res" : "Ej: Café americano"}
                        maxLength={255}
                    />

                    <Textarea<ProductForm>
                        name="descripcion"
                        label="Descripción"
                        placeholder="Descripción del producto (opcional)"
                        formik={formik}
                        rows={2}
                    />

                    <ProductIconField formik={formik} />

                    <ProductPricingFields formik={formik} categories={categories} />

                    {sellByWeight && <UnidadMedidaField formik={formik} />}

                    {/* En negocios de venta por peso, un producto puntual con unidad_medida
                        "unidad" puede vender por pieza suelta además de su precio base (ej.
                        Chorizo: bolsa a precio normal + variante "Pieza") — mismo campo de
                        variantes que ya usan los negocios tipo restaurante, sin duplicar UI.
                        No aplica si el producto maneja stock (ver nota en ProductStockToggle). */}
                    {canUseVariants && <ProductVariantsField formik={formik} />}

                    <ProductCodeField formik={formik} />

                    {/* stockEnabled es business_config.stock_enabled (bandera por tenant
                        gestionada desde SuperAdmin) — si el negocio no tiene stock habilitado,
                        la sección ni se muestra en vez de mostrarla deshabilitada. */}
                    {stockEnabled && (
                        <>
                            <ProductStockToggle
                                formik={formik}
                                disabled={hasVariants}
                                disabledMessage={hasVariants ? "No disponible en un producto con variantes" : undefined}
                            />
                            <ProductStockFields
                                formik={formik}
                                isEdit={isEdit}
                                wasManagingStock={wasManagingStock}
                                currentStock={currentStock}
                            />
                        </>
                    )}

                    <ProductAvailabilityToggle formik={formik} />

                    <ProductModalFooter isEdit={isEdit} isSubmitting={formik.isSubmitting} onClose={onClose} />
                </form>
            </div>
        </div>
    );
};
