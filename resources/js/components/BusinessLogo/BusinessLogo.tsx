import { ShoppingCart } from "lucide-react";
import { BUSINESS_ICONS } from "@/pages/Admin/partials/Logo/IconSelector";

interface BusinessLogoProps {
    logoUrl: string | null;
    logoIcon: string | null;
    size?: number;
    iconClassName?: string;
    imgClassName?: string;
    onClick?: () => void;
}

export function BusinessLogo({
    logoUrl,
    logoIcon,
    size = 20,
    iconClassName = "text-white",
    imgClassName = "w-full h-full object-cover",
    onClick,
}: BusinessLogoProps) {
    if (logoUrl) {
        return <img src={logoUrl} alt="" className={imgClassName} />;
    }

    if (logoIcon) {
        const def = BUSINESS_ICONS.find((i) => i.name === logoIcon);
        if (def) {
            const Icon = def.component;
            return <Icon className={`${iconClassName} cursor-pointer`} size={size} onClick={() => onClick && onClick()} />;
        }
    }

    return <ShoppingCart className={`${iconClassName} cursor-pointer`} size={size} onClick={() => onClick && onClick()} />;
}
