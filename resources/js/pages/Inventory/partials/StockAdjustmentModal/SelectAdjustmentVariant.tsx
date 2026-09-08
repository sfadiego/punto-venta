import { Select } from "@/components/ui/form/Select";
import { IProductVariant } from "@/models/IProductVariant";

interface SelectAdjustmentVariantProps {
    variants: IProductVariant[];
    value: string;
    onChange: (value: string) => void;
}

export const SelectAdjustmentVariant = ({ variants, value, onChange }: SelectAdjustmentVariantProps) => {
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
