import { Select } from "@/components/ui/form/Select";
import { IOrderProduct } from "@/models/IOrderProduct";
import { trimDecimalZeros } from "@/utils/formatDecimal";

interface SelectReturnLineProps {
    lines: IOrderProduct[];
    value: string;
    onChange: (value: string) => void;
}

export const SelectReturnLine = ({ lines, value, onChange }: SelectReturnLineProps) => {
    const options = lines.map((line) => ({
        value: String(line.id),
        label: `${line.product?.nombre ?? "Producto"}${line.variant ? ` (${line.variant.nombre})` : ""}  x ${trimDecimalZeros(line.cantidad)}`,
    }));

    return (
        <Select<{ order_product_id: string }>
            name="order_product_id"
            label="Producto vendido *"
            placeholder="Selecciona una línea..."
            options={options}
            value={value}
            onChange={onChange}
        />
    );
};
