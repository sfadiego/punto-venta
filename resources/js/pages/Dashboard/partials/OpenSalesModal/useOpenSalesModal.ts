import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useAxios } from "@/hooks/useAxios";
import { useStoreOpenSales } from "@/services/useOpenSalesService";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IMainOrderReport } from "@/models/IMainOrderReport";

export type OpenSalesForm = {
    efectivo_caja_inicio: string;
    observaciones: string;
};

const schema = Yup.object({
    efectivo_caja_inicio: Yup.number()
        .typeError("Ingresa un monto válido")
        .min(0, "El monto no puede ser negativo")
        .required("El efectivo inicial es requerido"),
    observaciones: Yup.string(),
});

export const useOpenSalesModal = () => {
    const { isOpen, openModal, closeModal } = useModal();
    // La sucursal para la que se abre la caja es siempre la activa de la sesión (el
    // switcher del sidebar, o la autoselección de AppLayout con 1 sola sucursal) — nunca
    // se vuelve a preguntar aquí. Pedirlo en el propio formulario duplicaba la decisión y
    // además quedaba desincronizado del switcher (formik no reaccionaba a cambios de
    // branchId entre una apertura y la siguiente), causando que se reenviara la sucursal
    // vieja en vez de la recién seleccionada en el sidebar.
    const { user, branchId: activeBranchId, setSistema } = useAxios();
    const queryClient = useQueryClient();
    const { mutateAsync: storeSales, isPending } = useStoreOpenSales();

    const formik = useFormik<OpenSalesForm>({
        initialValues: {
            efectivo_caja_inicio: "",
            observaciones: "",
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const response = await storeSales({
                user_id: user!.id,
                efectivo_caja_inicio: Number(values.efectivo_caja_inicio),
                observaciones: values.observaciones,
                ...(activeBranchId ? { branch_id: activeBranchId } : {}),
            });

            const sale = (response.data as { data: IMainOrderReport }).data;
            setSistema(sale.id ?? null);
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/active-sale`] });
            toast.success("Caja abierta exitosamente");
            helpers.resetForm();
            closeModal();
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik, isPending };
};
