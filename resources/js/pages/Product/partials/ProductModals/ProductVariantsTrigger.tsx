import { FormikProps } from "formik";
import { ChevronRight, Layers } from "lucide-react";
import { ProductForm } from "./useProductModal";
import { ProductVariantsModal } from "./ProductVariantsModal";
import { useModal } from "@/hooks/useModal";
import { IProductVariant } from "@/models/IProductVariant";

interface ProductVariantsTriggerProps {
    formik: FormikProps<ProductForm>;
    manageStock: boolean;
    productVariants: IProductVariant[];
}

export const ProductVariantsTrigger = ({ formik, manageStock, productVariants }: ProductVariantsTriggerProps) => {
    const { isOpen, openModal, closeModal } = useModal();
    const count = formik.values.variants.length;

    return (
        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Variantes de producto</label>
            <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
                <span className="w-9 h-9 shrink-0 rounded-lg border border-stone-200 bg-white flex items-center justify-center">
                    <Layers size={16} className="text-stone-500" />
                </span>
                <span className="text-sm text-stone-600 flex-1 text-left">
                    {count > 0 ? `${count} variante${count > 1 ? "s" : ""} configurada${count > 1 ? "s" : ""}` : "Gestionar variantes"}
                </span>
                <ChevronRight size={16} className="text-stone-400" />
            </button>

            <ProductVariantsModal
                isOpen={isOpen}
                formik={formik}
                manageStock={manageStock}
                productVariants={productVariants}
                onClose={closeModal}
            />
        </div>
    );
};
