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
            <Input<ProductForm>
                name="precio"
                inputType="number"
                min={0}
                step={0.5}
                placeholder="0.00"
                formik={formik}
                icon="$"
                className="tabular-nums"
            />
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
