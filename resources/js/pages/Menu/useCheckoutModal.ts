import { useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useCreatePublicOrder, useGetMenuCustomerByPhone } from "@/services/useMenuService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ICartItem } from "@/models/IMenu";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";

interface CheckoutModalParams {
    slug: string;
    items: ICartItem[];
    deliveryCost: number;
    onSuccess: () => void;
}

const schema = Yup.object({
    customer_name: Yup.string().required("Tu nombre es requerido"),
    customer_phone: Yup.string()
        .required("Tu teléfono es requerido")
        .max(13, "El teléfono no puede tener más de 12 dígitos")
        .test("phone-valid", phoneValidationMessage, (v) => !v || isValidPhone(v)),
    is_delivery: Yup.boolean().required(),
    delivery_address: Yup.string().when("is_delivery", {
        is: true,
        then: (s) => s.required("La dirección es requerida"),
        otherwise: (s) => s.nullable(),
    }),
});

export const useCheckoutModal = ({ slug, items, deliveryCost, onSuccess }: CheckoutModalParams) => {
    const { mutateAsync } = useCreatePublicOrder(slug);
    const prefillApplied = useRef(false);

    const formik = useFormik({
        initialValues: {
            customer_name: "",
            customer_phone: "",
            is_delivery: false,
            delivery_address: "",
            delivery_reference: "",
        },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                await mutateAsync({
                    customer_name: values.customer_name,
                    customer_phone: values.customer_phone,
                    is_delivery: values.is_delivery,
                    delivery_address: values.is_delivery ? values.delivery_address : null,
                    delivery_reference: values.is_delivery ? values.delivery_reference || null : null,
                    items: items.map((i) => ({
                        product_id: i.product.id,
                        cantidad: i.cantidad,
                        observacion: i.observacion ?? null,
                    })),
                });
                toast.success("¡Pedido solicitado! Comunicate con el negocio para confirmarlo.");
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

    const formikRef = useRef(formik);
    formikRef.current = formik;

    const phone = formik.values.customer_phone;
    const { data: customerData } = useGetMenuCustomerByPhone(slug, phone);
    useEffect(() => {
        if (!customerData || prefillApplied.current) return;
        prefillApplied.current = true;

        const { values, setFieldValue } = formikRef.current;
        if (!values.customer_name) setFieldValue("customer_name", customerData.customer_name);
        if (customerData.delivery_address && !values.delivery_address) {
            setFieldValue("delivery_address", customerData.delivery_address);
            setFieldValue("is_delivery", true);
        }
        if (customerData.delivery_reference && !values.delivery_reference) {
            setFieldValue("delivery_reference", customerData.delivery_reference);
        }
    }, [customerData]);

    useEffect(() => {
        if (!isValidPhone(phone)) {
            prefillApplied.current = false;
        }
    }, [phone]);

    const subtotal = items.reduce((sum, i) => sum + Number(i.product.precio) * i.cantidad, 0);
    const total = subtotal + (formik.values.is_delivery ? Number(deliveryCost) : 0);

    return { formik, subtotal, total, deliveryCost };
};
