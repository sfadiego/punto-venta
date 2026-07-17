import { useEffect, useState } from "react";
import { Input } from "@/components/ui/form/Input";

const PRESETS = [10, 15, 20];

interface PayPropinaInputProps {
    isCash: boolean;
    subtotal: number;
    propina: string;
    setPropina: (v: string) => void;
}

export const PayPropinaInput = ({ isCash, subtotal, propina, setPropina }: PayPropinaInputProps) => {
    const [selectedPct, setSelectedPct] = useState<number | null>(null);

    // Reset selected percentage when the modal resets (propina cleared externally)
    useEffect(() => {
        if (propina === "") setSelectedPct(null);
    }, [propina]);

    const handlePreset = (pct: number) => {
        const amount = parseFloat((subtotal * pct / 100).toFixed(2));
        setSelectedPct(pct);
        setPropina(String(amount));
    };

    const handleChange = (val: string) => {
        setSelectedPct(null);
        const num = parseFloat(val);
        if (val === "" || (!isNaN(num) && num >= 0)) setPropina(val);
    };

    return (
        <div className={`fade-collapse ${!isCash ? "is-visible" : "is-hidden"}`}>
            <div className="space-y-2">
                <p className="text-xs text-stone-500">Propina (opcional)</p>

                <div className="flex gap-2">
                    {PRESETS.map((pct) => (
                        <button
                            key={pct}
                            type="button"
                            onClick={() => handlePreset(pct)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                selectedPct === pct
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600"
                            }`}
                        >
                            {pct}%
                        </button>
                    ))}
                </div>

                <Input
                    name="propina"
                    inputType="number"
                    placeholder="0.00"
                    min={0}
                    step={1}
                    value={propina}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </div>
        </div>
    );
};
