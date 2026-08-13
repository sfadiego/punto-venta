import { Package } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { getOpenmojiIconPath } from "@/utils/iconAssets";

interface CatalogIconProps {
    iconName?: string | null;
    iconSource?: IconSourceEnum | string | null;
    size?: number;
    className?: string;
}

export const CatalogIcon = ({ iconName, iconSource, size = 16, className }: CatalogIconProps) => {
    if (iconName && iconSource === IconSourceEnum.Openmoji) {
        return (
            <img
                src={getOpenmojiIconPath(iconName)}
                alt=""
                style={{ width: size, height: size }}
                className={className}
            />
        );
    }

    if (iconName && iconSource === IconSourceEnum.Lucide) {
        return <DynamicIcon name={iconName} size={size} className={className} />;
    }

    return <Package size={size} className={className} />;
};
