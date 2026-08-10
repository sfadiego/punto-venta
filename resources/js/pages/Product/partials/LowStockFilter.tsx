import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";

interface LowStockFilterProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const LowStockFilter = ({ checked, onChange }: LowStockFilterProps) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
        <div>
            <p className="text-sm font-medium text-stone-700">Solo stock bajo</p>
            <p className="text-xs text-stone-400">Productos en o por debajo de su stock mínimo</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} activeColor="bg-red-500" />
    </div>
);
