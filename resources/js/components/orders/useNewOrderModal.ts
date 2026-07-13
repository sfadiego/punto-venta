import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/useModal";
import { useAxios } from "@/hooks/useAxios";
import { useStoreOrder } from "@/services/useOrderService";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

type NewOrderForm = {
    nombre_pedido: string;
};

const schema = Yup.object({
    nombre_pedido: Yup.string().trim().required("El nombre de la mesa es requerido").max(255, "Máximo 255 caracteres"),
});

export const useNewOrderModal = () => {
    const navigate = useNavigate();
    const { isOpen, openModal, closeModal } = useModal();
    const { sistemaId } = useAxios();
    const { mutateAsync: storeOrder, isPending } = useStoreOrder();

    const formik = useFormik<NewOrderForm>({
        initialValues: { nombre_pedido: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const response = await storeOrder({
                nombre_pedido: values.nombre_pedido.trim(),
                total: 0,
                subtotal: 0,
                descuento: 0,
                sistema_id: sistemaId,
                estatus_pedido_id: OrderStatusEnum.InProcess,
            });

            const newOrder = (response.data as { data: IOrder }).data;
            helpers.resetForm();
            closeModal();
            navigate(`/take-order/${newOrder.id}`);
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik, isPending };
};
