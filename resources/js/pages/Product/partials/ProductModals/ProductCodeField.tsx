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
            label="Código de barras"
            formik={formik}
            placeholder="Se genera automático si se deja vacío"
            maxLength={64}
        />
        <p className="text-xs text-stone-400 mt-1">Usado por el lector de código de barras para buscar el producto.</p>
    </div>
);
