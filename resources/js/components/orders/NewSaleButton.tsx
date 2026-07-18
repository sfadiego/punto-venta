import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SellByWeightSaleModal } from "@/pages/Dashboard/partials/SellByWeightSaleModal/SellByWeightSaleModal";

interface NewSaleButtonProps {
    className?: string;
}

export const NewSaleButton = ({ className }: NewSaleButtonProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={className ?? "flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"}
            >
                <ShoppingCart size={16} />
                Nueva venta
            </button>

            {open && <SellByWeightSaleModal onClose={() => setOpen(false)} />}
        </>
    );
};
