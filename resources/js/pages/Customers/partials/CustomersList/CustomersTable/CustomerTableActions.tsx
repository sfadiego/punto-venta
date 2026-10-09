import { Eye, Pencil, Trash2, Loader } from "lucide-react";
import { ICustomer } from "@/models/ICustomer";
import { useCustomerTableActions } from "./useCustomerTableActions";

interface CustomerTableActionsProps {
    customer: ICustomer;
    onEdit: (customer: ICustomer) => void;
}

export const CustomerTableActions = ({ customer, onEdit }: CustomerTableActionsProps) => {
    const { isAdmin, isDeleting, goToDetail, handleDelete } = useCustomerTableActions(customer);

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={goToDetail}
                title="Ver detalle"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
            >
                <Eye size={20} />
            </button>
            {isAdmin && (
                <button
                    onClick={() => onEdit(customer)}
                    title="Editar cliente"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                >
                    <Pencil size={20} />
                </button>
            )}
            {isAdmin && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Eliminar cliente"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
                >
                    {isDeleting
                        ? <Loader size={20} className="animate-spin text-red-500" />
                        : <Trash2 size={20} />
                    }
                </button>
            )}
        </div>
    );
};
