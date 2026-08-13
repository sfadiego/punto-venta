import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { IconSourceEnum } from "@/enums/IconSourceEnum";

interface CategoryPillProps {
    label: string;
    icon?: string | null;
    iconSource?: IconSourceEnum | null;
    active: boolean;
    onClick: () => void;
    primaryColor: string;
}

export const CategoryPill = ({ label, icon, iconSource, active, onClick, primaryColor }: CategoryPillProps) => (
    <button
        onClick={onClick}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]"
        style={
            active
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f5f5f4", color: "#57534e" }
        }
    >
        {icon && <CatalogIcon iconName={icon} iconSource={iconSource} size={15} />}
        {label}
    </button>
);
