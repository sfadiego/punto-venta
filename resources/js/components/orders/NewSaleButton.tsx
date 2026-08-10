import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { AdminRoutes } from "@/enums/RoutesEnum";

interface NewSaleButtonProps {
    className?: string;
}

export const NewSaleButton = ({ className }: NewSaleButtonProps) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(AdminRoutes.QuickSale)}
            className={className ?? "flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"}
        >
            <ShoppingCart size={16} />
            <span className="hidden md:inline lg:inline">Nueva venta</span>
        </button>
    );
};
