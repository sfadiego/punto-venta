import { Eye, Pencil, Trash2, Loader, ToggleLeft, ToggleRight } from "lucide-react";
import { IEmployee } from "@/models/IEmployee";
import { useEmployeeTableActions } from "./useEmployeeTableActions";

interface EmployeeTableActionsProps {
    employee: IEmployee;
    onEdit: (employee: IEmployee) => void;
}

export const EmployeeTableActions = ({ employee, onEdit }: EmployeeTableActionsProps) => {
    const {
        isAdmin,
        isDeleting,
        isToggling,
        goToDetail,
        handleToggleActive,
        handleDelete,
    } = useEmployeeTableActions(employee);

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
                    onClick={() => onEdit(employee)}
                    title="Editar empleado"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                >
                    <Pencil size={20} />
                </button>
            )}
            {isAdmin && (
                <button
                    onClick={handleToggleActive}
                    disabled={isToggling}
                    title={employee.active ? "Ocultar empleado" : "Mostrar empleado"}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all disabled:opacity-50"
                >
                    {isToggling
                        ? <Loader size={20} className="animate-spin text-stone-500" />
                        : employee.active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />
                    }
                </button>
            )}
            {isAdmin && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Eliminar empleado"
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
