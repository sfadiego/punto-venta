import { ChevronLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";

interface TenantFormHeaderProps {
    isEdit: boolean;
    tenantId?: number;
}

export const TenantFormHeader = ({ isEdit, tenantId }: TenantFormHeaderProps) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(SuperAdminRoutes.Tenants)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEdit ? "Editar cliente" : "Nuevo cliente"}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {isEdit ? "Modifica la configuración del tenant" : "Registra un nuevo tenant en el sistema"}
                    </p>
                </div>
            </div>
            {isEdit && (
                <button
                    type="button"
                    onClick={() => navigate(SuperAdminRoutes.TenantUsers.replace(":id", String(tenantId)))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <Users size={15} />
                    Usuarios
                </button>
            )}
        </div>
    );
};
