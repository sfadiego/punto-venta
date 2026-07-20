import { AlertTriangle } from "lucide-react";
import { ClearDemoDataButton } from "./ClearDemoDataButton";

interface TenantDangerZoneProps {
    tenantId: number;
}

export const TenantDangerZone = ({ tenantId }: TenantDangerZoneProps) => (
    <section className="mt-6 bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
            <div className="gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mb-2">
                    <AlertTriangle size={17} className="text-red-500" />
                </div>
                <div className="mb-2">
                    <h2 className="text-sm font-semibold text-slate-900 mb-2">Zona de peligro</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Elimina todos los datos de prueba generados durante el demo. Esta acción no se puede deshacer.
                    </p>
                </div>
                <ClearDemoDataButton tenantId={tenantId} />
            </div>
        </div>
    </section>
);
