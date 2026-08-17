import { Building2, Pencil, Trash2, Users, PowerOff, Power, RotateCcw, ExternalLink, UtensilsCrossed, Scale, Store } from "lucide-react";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";
import { ITenant } from "@/models/ITenant";
import { ActiveUsersBadge } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersBadge";
import { InactivityBadge } from "@/components/SuperAdmin/Tenants/Activity/InactivityBadge";

const BUSINESS_TYPE_SHORT_LABELS: Record<BusinessTypeEnum, string> = {
    [BusinessTypeEnum.Restaurante]:  "Restaurante",
    [BusinessTypeEnum.VentaPorPeso]: "Venta por peso",
    [BusinessTypeEnum.Retail]:       "Tienda",
};

const BUSINESS_TYPE_ICONS: Record<BusinessTypeEnum, typeof Scale> = {
    [BusinessTypeEnum.VentaPorPeso]: Scale,
    [BusinessTypeEnum.Retail]:       Store,
    [BusinessTypeEnum.Restaurante]:  UtensilsCrossed,
};

interface TenantCardProps {
    tenant: ITenant;
    isDeleted: boolean;
    onEdit: () => void;
    onToggle: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

export const TenantCard = ({ tenant, isDeleted, onEdit, onToggle, onRestore, onDelete }: TenantCardProps) => (
    <div
        className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-opacity ${
            isDeleted
                ? "border-red-100 opacity-60"
                : tenant.activo
                ? "border-slate-100"
                : "border-amber-200 opacity-70"
        }`}
    >
        <div className="flex items-start gap-3">
            <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: tenant.activo && !isDeleted ? tenant.primary_color : "#9ca3af" }}
            >
                <Building2 size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">{tenant.business_name}</p>
                    {isDeleted && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                            Eliminado
                        </span>
                    )}
                    {!isDeleted && !tenant.activo && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Inactivo
                        </span>
                    )}
                    {tenant.is_demo && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            Demo
                        </span>
                    )}
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {(() => {
                            const BusinessTypeIcon = BUSINESS_TYPE_ICONS[tenant.tipo_negocio];
                            return <BusinessTypeIcon size={11} />;
                        })()}
                        {BUSINESS_TYPE_SHORT_LABELS[tenant.tipo_negocio]}
                    </span>
                    <ActiveUsersBadge count={tenant.active_users_count ?? 0} />
                    <InactivityBadge lastActivityAt={tenant.last_activity_at} />
                </div>
                <a
                    href={`${import.meta.env.VITE_APP_URL}/${tenant.slug}/auth`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 font-mono mt-0.5 hover:text-indigo-600 transition-colors w-fit"
                    title="Abrir panel del cliente"
                >
                    /{tenant.slug}/login
                    <ExternalLink size={11} />
                </a>
                <a
                    href={`${import.meta.env.VITE_APP_URL}/${tenant.slug}/menu`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 font-mono mt-0.5 hover:text-indigo-600 transition-colors w-fit"
                    title="Abrir panel del cliente"
                >
                    /{tenant.slug}/menu
                    <ExternalLink size={11} />
                </a>
            </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={14} />
            <span>{tenant.users_count ?? 0} usuario{tenant.users_count !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-100">
            <div className="flex gap-1.5 flex-1">
                {[tenant.primary_color, tenant.sidebar_color, tenant.font_color].map((color, i) => (
                    <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>

            {isDeleted ? (
                <button
                    onClick={onRestore}
                    title="Restaurar"
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            ) : (
                <>
                    <button
                        onClick={onToggle}
                        title={tenant.activo ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg transition-colors ${
                            tenant.activo
                                ? "hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                                : "hover:bg-green-50 text-slate-500 hover:text-green-600"
                        }`}
                    >
                        {tenant.activo ? <PowerOff size={15} /> : <Power size={15} />}
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </>
            )}
        </div>
    </div>
);
