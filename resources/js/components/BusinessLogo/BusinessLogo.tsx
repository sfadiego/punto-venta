import { ShoppingCart } from "lucide-react";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { IconSourceEnum } from "@/enums/IconSourceEnum";

interface BusinessLogoProps {
    logoUrl: string | null;
    logoIcon: string | null;
    logoIconSource?: IconSourceEnum | string | null;
    size?: number;
    iconClassName?: string;
    imgClassName?: string;
    onClick?: () => void;
}

export function BusinessLogo({
    logoUrl,
    logoIcon,
    logoIconSource,
    size = 20,
    iconClassName = "text-white",
    imgClassName = "w-full h-full object-cover",
    onClick,
}: BusinessLogoProps) {
    if (logoUrl) {
        return <img src={logoUrl} alt="" className={imgClassName} />;
    }

    if (logoIcon) {
        return (
            <CatalogIcon
                iconName={logoIcon}
                iconSource={logoIconSource}
                size={size}
                className={`${iconClassName} cursor-pointer`}
                onClick={() => onClick && onClick()}
            />
        );
    }

    return <ShoppingCart className={`${iconClassName} cursor-pointer`} size={size} onClick={() => onClick && onClick()} />;
}
