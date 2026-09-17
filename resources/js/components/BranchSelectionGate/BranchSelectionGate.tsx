import { Store, LogOut, Loader } from "lucide-react";
import { useAxios } from "@/hooks/useAxios";
import { useBranchList } from "@/services/useBranchService";
import { BranchOptionButton } from "./BranchOptionButton";

/**
 * Pantalla bloqueante montada por AppLayout cuando el usuario autenticado tiene más de
 * una sucursal autorizada y todavía no eligió con cuál trabajar en esta sesión
 * (AxiosContext.branchId). Con una sola sucursal se autoselecciona sin llegar aquí (ver
 * AppLayout); con cero (tenant sin la feature), tampoco aplica.
 */
export const BranchSelectionGate = () => {
    const { setBranch, logout, user } = useAxios();
    const { data: branches, isLoading } = useBranchList();

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Store size={32} className="text-amber-600" />
                    </div>
                    <h1 className="text-xl font-bold text-stone-900 mb-1">Elige tu sucursal</h1>
                    <p className="text-stone-500 text-sm">
                        {user?.nombre ? `Hola, ${user.nombre}. ` : ""}
                        Selecciona con cuál sucursal quieres trabajar hoy.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader size={20} className="animate-spin text-stone-400" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {branches?.map((branch) => (
                            <BranchOptionButton
                                key={branch.id}
                                name={branch.name}
                                address={branch.address}
                                onClick={() => setBranch(branch.id)}
                            />
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 mt-6 text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <LogOut size={14} />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};
