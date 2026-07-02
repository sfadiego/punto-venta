import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useStoreProduct } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { useAxios } from "@/hooks/useAxios";

export type ProductForm = {
    nombre: string;
    descripcion: string;
    precio: string;
    categoria_id: string;
    unidad_medida: UnidadMedidaEnum;
    activo: boolean;
};

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es requerido"),
    descripcion: Yup.string(),
    precio: Yup.number()
        .typeError("Ingresa un precio válido")
        .min(0, "El precio no puede ser negativo")
        .required("El precio es requerido"),
    categoria_id: Yup.string().required("La categoría es requerida"),
    unidad_medida: Yup.string().required(),
    activo: Yup.boolean(),
});

export const useAddProductModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeProduct } = useStoreProduct();
    const { data: categories } = useIndexCategories();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const formik = useFormik<ProductForm>({
        initialValues: {
            nombre: "",
            descripcion: "",
            precio: "",
            categoria_id: "",
            unidad_medida: sellByWeight ? UnidadMedidaEnum.Kg : UnidadMedidaEnum.Unidad,
            activo: true,
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                await storeProduct({
                    nombre: values.nombre.trim(),
                    descripcion: values.descripcion.trim(),
                    precio: Number(values.precio),
                    categoria_id: Number(values.categoria_id),
                    unidad_medida: values.unidad_medida,
                    activo: values.activo,
                });
                toast.success("Producto creado exitosamente");
                helpers.resetForm();
                closeModal();
                onSuccess();
            } catch {
                toast.error("Error al crear el producto");
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return {
        isOpen,
        openModal,
        handleClose,
        formik,
        categories: categories ?? [],
        sellByWeight,
    };
};
