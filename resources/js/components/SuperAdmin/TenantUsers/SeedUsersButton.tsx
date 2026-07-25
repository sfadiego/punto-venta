import { Loader, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useSeedTenantUsers } from "@/services/useTenantUserService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface SeedUsersButtonProps {
    tenantId: number;
}

export const SeedUsersButton = ({ tenantId }: SeedUsersButtonProps) => {
    const { mutate, isPending } = useSeedTenantUsers(tenantId);

    const handleSeed = () => {
        mutate(undefined, {
            onSuccess: (res) => {
                const { created, skipped } = res.data.data as {
                    created: string[];
                    skipped: string[];
                };

                if (created.length > 0) {
                    toast.success(`Usuarios creados: ${created.join(", ")}`);
                }
                if (skipped.length > 0) {
                    toast.info(`Ya existían: ${skipped.join(", ")}`);
                }
                if (created.length === 0 && skipped.length === 0) {
                    toast.info("No se crearon usuarios.");
                }
            },
            onError: (error) => {
                toast.error(getUserFacingErrorMessage(error, "Error al crear los usuarios de acceso."));
            },
        });
    };

    return (
        <button
            onClick={handleSeed}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {isPending ? (
                <Loader size={15} className="animate-spin" />
            ) : (
                <Users size={15} />
            )}
            Crear usuarios de acceso
        </button>
    );
};
