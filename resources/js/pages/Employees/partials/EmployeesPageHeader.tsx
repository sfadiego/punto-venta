import { Plus, RefreshCw } from "lucide-react";

interface EmployeesPageHeaderProps {
    total: number;
    onRefresh: () => void;
    onCreate: () => void;
}

export const EmployeesPageHeader = ({ total, onRefresh, onCreate }: EmployeesPageHeaderProps) => (
    <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-stone-900">Empleados</h1>
            <p className="text-stone-500 text-sm mt-0.5">
                {total} {total === 1 ? "empleado registrado" : "empleados registrados"}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onRefresh}
                className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
                onClick={onCreate}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
            >
                <Plus size={16} />
                Nuevo empleado
            </button>
        </div>
    </div>
);
