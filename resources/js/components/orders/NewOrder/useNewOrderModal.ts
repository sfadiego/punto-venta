import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/useModal";
import { useAxios } from "@/hooks/useAxios";
import { useStoreOrder } from "@/services/useOrderService";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { resolveSaleName } from "@/utils/resolveSaleName";

type NewOrderForm = {
    nombre_pedido: string;
};

export const useNewOrderModal = () => {
    const navigate = useNavigate();
    const { isOpen, openModal, closeModal } = useModal();
    const { sistemaId, features } = useAxios();
    const { mutateAsync: storeOrder, isPending } = useStoreOrder();
    // kitchen_view distingue servicio en mesa (Restaurante) de venta de mostrador (Retail) —
    // ambos comparten sell_by_weight=false, así que no sirve para esta distinción.
    const kitchenView = features?.kitchen_view === true;
    // Retail no necesita nombrar la venta — se autogenera un folio (mismo criterio que ya usa
    // QuickSale para venta por peso, ver resolveSaleName) en vez de pedirlo en el modal.
    const isRetail = features?.is_retail === true;

    const schema = Yup.object({
        nombre_pedido: isRetail
            ? Yup.string().trim().max(255, "Máximo 255 caracteres")
            : Yup.string().trim()
                  .required(kitchenView ? "El nombre de la mesa es requerido" : "El nombre de la venta es requerido")
                  .max(255, "Máximo 255 caracteres"),
    });

    const formik = useFormik<NewOrderForm>({
        initialValues: { nombre_pedido: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const response = await storeOrder({
                nombre_pedido: isRetail ? resolveSaleName(values.nombre_pedido) : values.nombre_pedido.trim(),
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

    return { isOpen, openModal, handleClose, formik, isPending, kitchenView, isRetail };
};
