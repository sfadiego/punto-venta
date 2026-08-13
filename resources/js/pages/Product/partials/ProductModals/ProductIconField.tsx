import { FormikProps } from "formik";
import { IconPickerField } from "@/components/ui/IconPickerField";
import { ProductForm } from "./useProductModal";

interface ProductIconFieldProps {
    formik: FormikProps<ProductForm>;
}

export const ProductIconField = ({ formik }: ProductIconFieldProps) => (
    <IconPickerField
        iconName={formik.values.icon_name}
        iconSource={formik.values.icon_source}
        onChange={(name, source) => {
            formik.setFieldValue("icon_name", name);
            formik.setFieldValue("icon_source", source);
        }}
    />
);
