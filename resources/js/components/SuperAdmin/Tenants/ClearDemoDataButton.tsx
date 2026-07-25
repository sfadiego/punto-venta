import { Trash2, Loader } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useClearDemoData } from "@/services/useSuperAdminService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface ClearDemoDataButtonProps {
    tenantId: number;
}

export const ClearDemoDataButton = ({ tenantId }: ClearDemoDataButtonProps) => {
    const { mutate, isPending } = useClearDemoData();

    const handleClear = async () => {
        const result = await Swal.fire({
            title: "¿Limpiar datos de demo?",
            text: "Se eliminarán todas las órdenes y reportes de este cliente. Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, limpiar",
        });

        if (!result.isConfirmed) return;

        mutate(tenantId, {
            onSuccess: () => toast.success("Datos de demo eliminados correctamente."),
            onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al limpiar los datos de demo.")),
        });
    };

    return (
        <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-3"
        >
            {isPending ? (
                <Loader size={15} className="animate-spin" />
            ) : (
                <Trash2 size={15} />
            )}
            Limpiar datos de demo
        </button>
    );
};
