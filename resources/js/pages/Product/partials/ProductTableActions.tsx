import { Pencil, Trash2, Loader, PackagePlus, History, ArrowUpDown, Barcode } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IProduct } from "@/models/IProduct";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useDeleteProduct } from "@/services/useProductService";
import { isProductRowLowStock } from "@/utils/stock";
import { useProductBarcodeDownload } from "./useProductBarcodeDownload";

interface ProductTableActionsProps {
    product: IProduct;
    onEdit: (product: IProduct) => void;
    onRestock: (product: IProduct) => void;
    onAdjust: (product: IProduct) => void;
    onViewMovements: (product: IProduct) => void;
    /** false en negocios retail — ahí el manejo de stock vive en la página de Inventario,
     * no duplicar el acceso rápido aquí (ver CLAUDE.md, Fase 9 del plan de Inventario). */
    showStockActions: boolean;
    /** true solo en negocios retail — el backend expone el código de barras únicamente ahí (middleware `retail`). */
    showBarcodeAction: boolean;
}

export const ProductTableActions = ({ product, onEdit, onRestock, onAdjust, onViewMovements, showStockActions, showBarcodeAction }: ProductTableActionsProps) => {
    const queryClient = useQueryClient();
    const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct(product.id);
    const { isDownloading: isDownloadingBarcode, handleDownload: handleDownloadBarcode } = useProductBarcodeDownload(product);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "¿Eliminar producto?",
            text: `"${product.nombre}" se eliminará de forma permanente.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteProduct({});
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
        toast.success("Producto eliminado");
    };

    return (
        <div className="flex items-center justify-center gap-0.5">
            {showStockActions && product.manage_stock && (
                <button
                    onClick={() => onViewMovements(product)}
                    title="Historial de stock"
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all"
                >
                    <History size={16} />
                </button>
            )}
            {showStockActions && isProductRowLowStock(product) && (
                <button
                    onClick={() => onRestock(product)}
                    title="Reabastecer stock"
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all"
                >
                    <PackagePlus size={16} />
                </button>
            )}
            {showStockActions && product.manage_stock && (
                <button
                    onClick={() => onAdjust(product)}
                    title="Ajustar stock"
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                >
                    <ArrowUpDown size={16} />
                </button>
            )}
            {showBarcodeAction && (
                <button
                    onClick={handleDownloadBarcode}
                    disabled={isDownloadingBarcode}
                    title="Descargar código de barras"
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all disabled:opacity-50"
                >
                    {isDownloadingBarcode
                        ? <Loader size={16} className="animate-spin text-stone-500" />
                        : <Barcode size={16} />
                    }
                </button>
            )}
            <button
                onClick={() => onEdit(product)}
                title="Editar producto"
                className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
                <Pencil size={16} />
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Eliminar producto"
                className="flex items-center justify-center w-6 h-6 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
            >
                {isDeleting
                    ? <Loader size={16} className="animate-spin text-red-500" />
                    : <Trash2 size={16} />
                }
            </button>
        </div>
    );
};
