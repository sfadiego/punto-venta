import { Plus } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { NewOrderModal } from "./NewOrderModal";
import { useNewOrderModal } from "./useNewOrderModal";

interface NewOrderButtonProps {
    className?: string;
}

export const NewOrderButton = ({ className }: NewOrderButtonProps) => {
    const { can } = usePermissions();
    const { isOpen, openModal, handleClose, formik, isPending } = useNewOrderModal();

    if (!can("takeOrder")) return null;

    return (
        <>
            <button
                onClick={openModal}
                className={className ?? "flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"}
                style={className ? undefined : { backgroundColor: "var(--color-primary)" }}
            >
                <Plus size={15} />
                Nueva orden
            </button>

            <NewOrderModal
                isOpen={isOpen}
                isPending={isPending}
                formik={formik}
                onClose={handleClose}
            />
        </>
    );
};
