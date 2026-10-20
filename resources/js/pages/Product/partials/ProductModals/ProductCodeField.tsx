import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { ProductForm } from "./useProductModal";

interface ProductCodeFieldProps {
    formik: FormikProps<ProductForm>;
}

export const ProductCodeField = ({ formik }: ProductCodeFieldProps) => (
    <div>
        <Input<ProductForm>
            name="product_code"
            label="Código"
            formik={formik}
            placeholder="ej: 1234567890"
            maxLength={64}
        />
        {!formik.errors.product_code && (
            <p className="mt-1 text-xs text-stone-400">
                Código de producto, sin caracteres especiales
            </p>
        )}
    </div>
);
