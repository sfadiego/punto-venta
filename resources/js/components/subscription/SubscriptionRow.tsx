interface RowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

export const Row = ({ icon, label, value }: RowProps) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-stone-500">
            {icon}
            {label}
        </div>
        <span className="text-sm font-medium text-stone-800">{value}</span>
    </div>
);

export const Divider = () => <hr className="border-stone-100" />;
