import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";

interface ReportModeToggleProps {
    reportMode: SalesReportModeEnum;
    onChange: (mode: SalesReportModeEnum) => void;
}

export const ReportModeToggle = ({ reportMode, onChange }: ReportModeToggleProps) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-stone-500">Período</label>
        <FeatureSpotlight
            featureKey={FeatureSpotlightKey.FilterSalesByDateMonth}
            title="Filtra por dia, semana o mes"
            description="Ahora puedes ver el resumen de ventas de diferentes periodos, no solo de un día."
        >
            <div className="flex h-9 rounded-xl border border-stone-200 overflow-hidden text-xs">
                <button
                    type="button"
                    onClick={() => onChange(SalesReportModeEnum.Day)}
                    className={`px-3 font-medium transition-colors ${
                        reportMode === SalesReportModeEnum.Day
                            ? "bg-amber-500 text-white"
                            : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                >
                    Día
                </button>
                <button
                    type="button"
                    onClick={() => onChange(SalesReportModeEnum.Week)}
                    className={`px-3 font-medium transition-colors border-l border-stone-200 ${
                        reportMode === SalesReportModeEnum.Week
                            ? "bg-amber-500 text-white"
                            : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                >
                    Semana
                </button>
                <button
                    type="button"
                    onClick={() => onChange(SalesReportModeEnum.Month)}
                    className={`px-3 font-medium transition-colors border-l border-stone-200 ${
                        reportMode === SalesReportModeEnum.Month
                            ? "bg-amber-500 text-white"
                            : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                >
                    Mes
                </button>
            </div>
        </FeatureSpotlight>
    </div>
);
