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
            placeholder="generado automáticamente"
            maxLength={64}
        />
    </div>
);
