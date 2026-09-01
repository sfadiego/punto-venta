import { FormikProps } from "formik";
import { ProductForm, ProductVariantFormValue } from "./useProductModal";

type VariantFieldName = "nombre" | "precio" | "stock" | "min_stock";

export const useProductVariantsField = (formik: FormikProps<ProductForm>) => {
    const { variants } = formik.values;

    const updateVariant = (index: number, patch: Partial<ProductVariantFormValue>) => {
        const next = variants.map((v, i) => (i === index ? { ...v, ...patch } : v));
        formik.setFieldValue("variants", next);
    };

    const addVariant = () => {
        formik.setFieldValue("variants", [...variants, { nombre: "", precio: "", stock: "", min_stock: "" }]);
    };

    const removeVariant = (index: number) => {
        formik.setFieldValue(
            "variants",
            variants.filter((_, i) => i !== index),
        );
    };

    const touchVariantField = (index: number, field: VariantFieldName) => {
        formik.setFieldTouched(`variants[${index}].${field}`, true);
    };

    const getVariantError = (index: number, field: VariantFieldName) => {
        const meta = formik.getFieldMeta(`variants[${index}].${field}`);
        const show = (meta.touched || formik.submitCount > 0) && !!meta.error;
        return show ? meta.error : undefined;
    };

    return { variants, updateVariant, addVariant, removeVariant, touchVariantField, getVariantError };
};
