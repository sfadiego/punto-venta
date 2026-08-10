import { DynamicIcon } from "@/components/ui/DynamicIcon";

interface CategoryPillProps {
    label: string;
    icon?: string | null;
    active: boolean;
    onClick: () => void;
    primaryColor: string;
}

export const CategoryPill = ({ label, icon, active, onClick, primaryColor }: CategoryPillProps) => (
    <button
        onClick={onClick}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]"
        style={
            active
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f5f5f4", color: "#57534e" }
        }
    >
        {icon && <DynamicIcon name={icon} size={15} />}
        {label}
    </button>
);
