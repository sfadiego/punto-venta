interface CloseSalesSectionHeadingProps {
    title: string;
    subtitle?: string;
}

export const CloseSalesSectionHeading = ({ title, subtitle }: CloseSalesSectionHeadingProps) => (
    <div className="mb-3">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
    </div>
);
