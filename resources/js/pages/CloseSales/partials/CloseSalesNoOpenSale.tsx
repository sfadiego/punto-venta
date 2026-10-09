import { AlertCircle } from "lucide-react";

// Estado de la página cuando no hay una caja abierta: no hay sesión que cerrar.
export const CloseSalesNoOpenSale = () => (
    <div className="px-5 py-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
            <AlertCircle size={48} className="text-stone-300" />
            <p className="text-lg font-medium text-stone-500">No hay una caja abierta actualmente</p>
            <p className="text-sm">Abre la caja desde el dashboard para registrar ventas.</p>
        </div>
    </div>
);
