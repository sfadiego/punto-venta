import { useEffect, useRef } from "react";
import { X, History, Loader } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { IStockMovement } from "@/models/IStockMovement";
import { StockMovementRow } from "./StockMovementRow";
import { SelectRestockVariant } from "../RestockModal/SelectRestockVariant";

interface StockMovementsModalProps {
    isOpen: boolean;
    product: IProduct | null;
    hasVariants: boolean;
    activeVariants: IProductVariant[];
    variantId: string;
    setVariantId: (value: string) => void;
    selectedVariant: IProductVariant | null;
    movements: IStockMovement[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    onClose: () => void;
}

export const StockMovementsModal = ({
    isOpen,
    product,
    hasVariants,
    activeVariants,
    variantId,
    setVariantId,
    selectedVariant,
    movements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    onClose,
}: StockMovementsModalProps) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900">Historial de stock</h2>
                        <p className="text-xs text-stone-400">{product.nombre}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 py-2 overflow-y-auto">
                    {hasVariants && (
                        <div className="pb-3">
                            <SelectRestockVariant variants={activeVariants} value={variantId} onChange={setVariantId} />
                        </div>
                    )}

                    {hasVariants && !selectedVariant ? (
                        <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                            <History size={28} className="mb-2 opacity-40" />
                            <p className="text-sm">Elige una variante para ver su historial</p>
                        </div>
                    ) : isLoading ? (
                        <div className="py-10 flex justify-center">
                            <Loader size={24} className="animate-spin text-stone-300" />
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                            <History size={28} className="mb-2 opacity-40" />
                            <p className="text-sm">Sin movimientos registrados</p>
                        </div>
                    ) : (
                        <>
                            {movements.map((movement) => (
                                <StockMovementRow key={movement.id} movement={movement} />
                            ))}
                            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                                {isFetchingNextPage && <Loader size={18} className="animate-spin text-stone-300" />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
