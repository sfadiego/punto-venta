import { Package } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { getOpenmojiIconPath, isEmojiSupported } from "@/utils/iconAssets";

interface CatalogIconProps {
    iconName?: string | null;
    iconSource?: IconSourceEnum | string | null;
    size?: number;
    className?: string;
    onClick?: () => void;
}

export const CatalogIcon = ({ iconName, iconSource, size = 16, className, onClick }: CatalogIconProps) => {
    // Emoji nativo: icon_name guarda el carácter emoji en sí (no un hexcode) — se imprime tal
    // cual y lo renderiza la fuente de emoji del sistema operativo, sin depender de un archivo.
    // Un producto/categoría puede tener guardado un emoji que en ESTE dispositivo no tiene
    // glifo de color (fuente desactualizada) — sin este chequeo se vería como caja "tofu" con
    // el hex crudo en vez de caer al ícono genérico.
    if (iconName && iconSource === IconSourceEnum.Native && isEmojiSupported(iconName)) {
        return (
            <span style={{ fontSize: size, lineHeight: 1 }} className={className} onClick={onClick}>
                {iconName}
            </span>
        );
    }

    if (iconName && iconSource === IconSourceEnum.Openmoji) {
        return (
            <img
                src={getOpenmojiIconPath(iconName)}
                alt=""
                style={{ width: size, height: size }}
                className={className}
                onClick={onClick}
            />
        );
    }

    if (iconName && iconSource === IconSourceEnum.Lucide) {
        return <DynamicIcon name={iconName} size={size} className={className} onClick={onClick} />;
    }

    return <Package size={size} className={className} onClick={onClick} />;
};
