import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";
import { ProductForm } from "./useProductModal";
import { ProductModalHeader } from "./ProductModalHeader";
import { ProductPricingFields } from "./ProductPricingFields";
import { ProductVariantsField } from "./ProductVariantsField";
import { UnidadMedidaField } from "./UnidadMedidaField";
import { ProductAvailabilityToggle } from "./ProductAvailabilityToggle";
import { ProductModalFooter } from "./ProductModalFooter";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";

interface ProductModalProps {
    isOpen: boolean;
    isEdit: boolean;
    formik: FormikProps<ProductForm>;
    categories: ICategory[];
    sellByWeight: boolean;
    onClose: () => void;
}

export const ProductModal = ({ isOpen, isEdit, formik, categories, sellByWeight, onClose }: ProductModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
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

                    <ProductPricingFields formik={formik} categories={categories} />

                    {!sellByWeight && <ProductVariantsField formik={formik} />}

                    {sellByWeight && <UnidadMedidaField formik={formik} />}

                    <ProductAvailabilityToggle formik={formik} />

                    <ProductModalFooter isEdit={isEdit} isSubmitting={formik.isSubmitting} onClose={onClose} />
                </form>
            </div>
        </div>
    );
};
