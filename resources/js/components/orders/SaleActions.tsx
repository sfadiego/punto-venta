import { PrintTicketButton } from "./PrintTicketButton";
import { usePermissions } from "@/hooks/usePermissions";

interface SaleActionsProps {
    orderId: number;
}

export const SaleActions = ({ orderId }: SaleActionsProps) => {
    const { can } = usePermissions();

    return (
        <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            {can("printTicket") && <PrintTicketButton orderId={orderId} />}
        </div>
    );
};
