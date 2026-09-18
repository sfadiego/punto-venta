import { Select } from "@/components/ui/form/Select";
import { IProductVariant } from "@/models/IProductVariant";

interface SelectProductVariantProps {
    variants: IProductVariant[];
    value: string;
    onChange: (value: string) => void;
}

// Selector controlado (no Formik) de la variante activa de un producto — compartido por los
// flujos de stock que necesitan elegir sobre cuál variante operar: reabastecer/reajustar
// (Productos e Inventario) y el historial de movimientos (StockMovementsModal).
export const SelectProductVariant = ({ variants, value, onChange }: SelectProductVariantProps) => {
    const options = variants.map((v) => ({ value: String(v.id), label: v.nombre }));

    return (
        <Select<{ variant_id: string }>
            name="variant_id"
            label="Variante *"
            placeholder="Selecciona una variante..."
            options={options}
            value={value}
            onChange={onChange}
        />
    );
};
