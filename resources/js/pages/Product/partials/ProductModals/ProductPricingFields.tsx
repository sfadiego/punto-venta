import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";
import { Input } from "@/components/ui/form/Input";
import { CategorySelect } from "@/components/ui/form/CategorySelect";
import { ProductForm } from "./useProductModal";

interface ProductPricingFieldsProps {
    formik: FormikProps<ProductForm>;
    categories: ICategory[];
}

export const ProductPricingFields = ({ formik, categories }: ProductPricingFieldsProps) => (
    <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Precio *</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <Input<ProductForm>
                    name="precio"
                    inputType="number"
                    min={0}
                    step={0.5}
                    placeholder="0.00"
                    formik={formik}
                    className="pl-7 tabular-nums"
                />
            </div>
        </div>

        <CategorySelect<ProductForm>
            name="categoria_id"
            label="Categoría *"
            formik={formik}
            categories={categories}
            placeholder="Seleccionar..."
        />
    </div>
);
