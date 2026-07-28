import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { MonthPicker } from "@/components/ui/form/MonthPicker";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";
import { localDateString } from "@/utils/dateUtils";

interface SalesPeriodInputProps {
    reportMode: SalesReportModeEnum;
    fecha: string | null;
    mes: string | null;
    onFechaChange: (value: string | null) => void;
    onMesChange: (value: string | null) => void;
}

export const SalesPeriodInput = ({
    reportMode,
    fecha,
    mes,
    onFechaChange,
    onMesChange,
}: SalesPeriodInputProps) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-stone-500">
            {reportMode === SalesReportModeEnum.Day ? "Fecha" : "Mes"}
        </label>
        {reportMode === SalesReportModeEnum.Day ? (
            <div className="relative">
                <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none z-10"
                />
                <Input
                    name="fecha"
                    inputType="date"
                    value={fecha ?? ""}
                    onChange={(e) => onFechaChange(e.target.value || null)}
                    className="!h-9 !py-0 !pl-8 !pr-3 !rounded-xl !border-stone-200 !bg-stone-50 !text-sm w-44"
                />
            </div>
        ) : (
            <MonthPicker value={mes ?? localDateString().slice(0, 7)} onChange={onMesChange} />
        )}
    </div>
);
