interface CloseSalesReceiptGroupProps {
    title: string;
}

export const CloseSalesReceiptGroup = ({ title }: CloseSalesReceiptGroupProps) => (
    <li className="pt-5 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</li>
);
