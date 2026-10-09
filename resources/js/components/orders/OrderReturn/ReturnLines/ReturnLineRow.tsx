import { IOrderProduct } from "@/models/IOrderProduct";
import { IReturnLineValue } from "@/models/IOrderReturnForm";
import { Input } from "@/components/ui/form/Input";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { calcReturnableQuantity, calcReturnedQuantity } from "@/utils/returnCalc";
import { isWeightUnit } from "@/utils/weightUnits";
import { ReturnQuantityStepper } from "./ReturnQuantityStepper";

interface ReturnLineRowProps {
    line: IOrderProduct;
    value: IReturnLineValue;
    error?: string;
    onToggle: (selected: boolean) => void;
    onQuantityChange: (quantity: string) => void;
}

// Una línea de la orden, compacta: casilla, nombre y lo vendido. La cantidad solo aparece cuando
// hace falta — con una sola pieza basta la casilla; con varias, un stepper; los productos por peso
// o volumen llevan un campo numérico porque aceptan decimales. Una línea ya devuelta por completo
// queda deshabilitada.
export const ReturnLineRow = ({ line, value, error, onToggle, onQuantityChange }: ReturnLineRowProps) => {
    const max = calcReturnableQuantity(line);
    const returned = calcReturnedQuantity(line);
    const fullyReturned = max === 0;
    const isWeight = isWeightUnit(line.product?.unidad_medida);
    const showStepper = value.selected && !isWeight && max > 1;
    const showInput = value.selected && isWeight;

    const meta = fullyReturned
        ? "Devuelto"
        : `x${trimDecimalZeros(line.cantidad)}${returned > 0 ? ` · ya devueltos ${trimDecimalZeros(returned)}` : ""}`;

    return (
        <div className={`border-b border-stone-100 px-5 py-2 last:border-0 ${fullyReturned ? "opacity-45" : value.selected ? "bg-amber-50/60" : ""}`}>
            <div className="flex min-h-8 items-center gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        checked={value.selected}
                        disabled={fullyReturned}
                        onChange={(e) => onToggle(e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded border-stone-300 accent-amber-500"
                    />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="truncate text-sm font-medium text-stone-800">
                            {line.product?.nombre ?? "Producto"}
                            {line.variant?.nombre && <span className="font-normal text-stone-500"> ({line.variant.nombre})</span>}
                        </span>
                        {line.product?.product_code && (
                            <span className="shrink-0 text-xs text-stone-400">{line.product.product_code}</span>
                        )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-stone-400">{meta}</span>
                </label>
                {showStepper && (
                    <ReturnQuantityStepper
                        quantity={Number(value.quantity) || 1}
                        max={max}
                        onChange={(quantity) => onQuantityChange(String(quantity))}
                    />
                )}
                {showInput && (
                    <div className="w-24 shrink-0">
                        <Input
                            name={`return-quantity-${value.order_product_id}`}
                            inputType="number"
                            min={0}
                            step={0.1}
                            value={value.quantity}
                            onChange={(e) => onQuantityChange(e.target.value)}
                            inputStyle={error ? "error" : "default"}
                            className="!px-3 !py-1.5"
                        />
                    </div>
                )}
            </div>
            {error && <p className="mt-1 pl-7 text-xs text-red-500">{error}</p>}
        </div>
    );
};
