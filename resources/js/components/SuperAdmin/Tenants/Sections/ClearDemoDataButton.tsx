import { useState } from "react";
import { Trash2, Loader } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { useClearDemoData } from "@/services/useSuperAdminService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface ClearDemoDataButtonProps {
    tenantId: number;
    tenantName: string;
}

export const ClearDemoDataButton = ({ tenantId, tenantName }: ClearDemoDataButtonProps) => {
    const { mutate, isPending } = useClearDemoData();
    const [deepClean, setDeepClean] = useState(false);

    const handleClear = async () => {
        const text = deepClean
            ? `Se eliminarán todas las órdenes, reportes, categorías, productos, clientes y proveedores de ${tenantName}. Esta acción no se puede deshacer.`
            : `Se eliminarán todas las órdenes y reportes de ${tenantName}. Esta acción no se puede deshacer.`;

        const result = await Swal.fire({
            title: `¿Limpiar datos de ${tenantName}?`,
            text,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, limpiar",
        });

        if (!result.isConfirmed) return;

        mutate(
            { id: tenantId, deepClean },
            {
                onSuccess: () => toast.success("Datos de demo eliminados correctamente."),
                onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al limpiar los datos de demo.")),
            },
        );
    };

    return (
        <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <ToggleSwitch checked={deepClean} onChange={setDeepClean} activeColor="bg-red-500" />
                <span className="text-sm text-stone-600">
                    Incluir catálogo (categorías, productos, clientes y proveedores)
                </span>
            </div>

            <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-fit"
            >
                {isPending ? (
                    <Loader size={15} className="animate-spin" />
                ) : (
                    <Trash2 size={15} />
                )}
                Limpiar datos de demo
            </button>
        </div>
    );
};
