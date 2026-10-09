interface CustomerFilterCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const CustomerFilterCheckbox = ({ label, checked, onChange }: CustomerFilterCheckboxProps) => (
    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
        />
        {label}
    </label>
);
