import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useCreatePublicOrder } from "@/services/useMenuService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ICartItem } from "@/models/IMenu";

interface CheckoutModalParams {
    slug: string;
    items: ICartItem[];
    deliveryCost: number;
    onSuccess: () => void;
}

const schema = Yup.object({
    customer_name:    Yup.string().required("Tu nombre es requerido"),
    customer_phone:   Yup.string()
        .required("Tu teléfono es requerido")
        .max(12, "El teléfono no puede tener más de 12 dígitos")
        .matches(/^\+?[\d]{10,12}$/, "Ingresa un número de teléfono válido (10-12 dígitos)"),
    is_delivery:      Yup.boolean().required(),
    delivery_address: Yup.string().when("is_delivery", {
        is: true,
        then: (s) => s.required("La dirección es requerida"),
        otherwise: (s) => s.nullable(),
    }),
});

export const useCheckoutModal = ({ slug, items, deliveryCost, onSuccess }: CheckoutModalParams) => {
    const { mutateAsync } = useCreatePublicOrder(slug);

    const formik = useFormik({
        initialValues: {
            customer_name:      "",
            customer_phone:     "",
            is_delivery:        false,
            delivery_address:   "",
            delivery_reference: "",
        },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                await mutateAsync({
                    customer_name:      values.customer_name,
                    customer_phone:     values.customer_phone,
                    is_delivery:        values.is_delivery,
                    delivery_address:   values.is_delivery ? values.delivery_address : null,
                    delivery_reference: values.is_delivery ? values.delivery_reference || null : null,
                    items: items.map((i) => ({
                        product_id: i.product.id,
                        cantidad:   i.cantidad,
                    })),
                });
                toast.success("¡Pedido enviado! El negocio se comunicará contigo para confirmarlo.");
                resetForm();
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useCheckoutModal.onSubmit");
                toast.error("No se pudo enviar el pedido. Intenta de nuevo.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    const subtotal = items.reduce((sum, i) => sum + Number(i.product.precio) * i.cantidad, 0);
    const total = subtotal + (formik.values.is_delivery ? Number(deliveryCost) : 0);

    return { formik, subtotal, total, deliveryCost };
};
