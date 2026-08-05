import { UserRound, Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useEmployeesSection } from "./useEmployeesSection";

interface EmployeesSectionProps {
    config: IBusinessConfig | undefined;
}

export const EmployeesSection = ({ config }: EmployeesSectionProps) => {
    const { toggle, isSubmitting } = useEmployeesSection(config);
    const enabled = !!config?.employees_enabled;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Empleados</h2>
                <p className="text-xs text-stone-400">
                    Administra tu plantilla de empleados: teléfono, salario y días laborales
                </p>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <UserRound size={16} className={enabled ? "text-amber-500" : "text-stone-300"} />
                    <span className="text-sm font-medium text-stone-700">
                        {enabled ? "Empleados activados" : "Empleados desactivados"}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={toggle}
                    disabled={isSubmitting || !config}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        enabled ? "bg-amber-500" : "bg-stone-200"
                    }`}
                >
                    {isSubmitting && (
                        <Loader size={10} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />
                    )}
                    <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                </button>
            </div>
        </div>
    );
};
