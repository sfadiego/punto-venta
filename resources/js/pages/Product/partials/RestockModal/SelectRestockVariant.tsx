import { Select } from "@/components/ui/form/Select";
import { IProductVariant } from "@/models/IProductVariant";

interface SelectRestockVariantProps {
    variants: IProductVariant[];
    value: string;
    onChange: (value: string) => void;
}

export const SelectRestockVariant = ({ variants, value, onChange }: SelectRestockVariantProps) => {
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
