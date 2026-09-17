import { useState } from "react";
import { Loader, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useSeedTenantUsers } from "@/services/useTenantUserService";
import { useListTenantBranches } from "@/services/useTenantBranchService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { SeedBranchPickerModal } from "./SeedBranchPickerModal";

interface SeedUsersButtonProps {
    tenantId: number;
}

export const SeedUsersButton = ({ tenantId }: SeedUsersButtonProps) => {
    const { mutate, isPending } = useSeedTenantUsers(tenantId);
    const { data: branches } = useListTenantBranches(tenantId);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [branchId, setBranchId] = useState("");

    // Con una sola sucursal el backend la autoasigna sin preguntar; con 2+, no hay forma
    // correcta de adivinar cuál usar — se le pide al SuperAdmin elegir una.
    const needsBranchPicker = (branches?.length ?? 0) > 1;

    const runSeed = (payload?: { branch_id?: number }) => {
        mutate(payload, {
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

                setPickerOpen(false);
                setBranchId("");
            },
            onError: (error) => {
                toast.error(getUserFacingErrorMessage(error, "Error al crear los usuarios de acceso."));
            },
        });
    };

    const handleClick = () => {
        if (needsBranchPicker) {
            setPickerOpen(true);
            return;
        }
        runSeed();
    };

    const handleConfirm = () => {
        if (!branchId) return;
        runSeed({ branch_id: Number(branchId) });
    };

    return (
        <>
            <button
                onClick={handleClick}
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

            <SeedBranchPickerModal
                isOpen={pickerOpen}
                branches={branches ?? []}
                value={branchId}
                onChange={setBranchId}
                onConfirm={handleConfirm}
                onClose={() => setPickerOpen(false)}
                isPending={isPending}
            />
        </>
    );
};
