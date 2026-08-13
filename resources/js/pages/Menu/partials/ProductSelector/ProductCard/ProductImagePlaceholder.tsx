import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { IconSourceEnum } from "@/enums/IconSourceEnum";

interface ProductImagePlaceholderProps {
    iconName?: string | null;
    iconSource?: IconSourceEnum | null;
}

export const ProductImagePlaceholder = ({ iconName, iconSource }: ProductImagePlaceholderProps) => (
    <div className="w-full h-32 sm:h-40 bg-stone-50 flex items-center justify-center">
        {iconName ? (
            <CatalogIcon iconName={iconName} iconSource={iconSource} size={40} className="text-stone-300" />
        ) : (
            <span className="text-4xl text-stone-200">🍽️</span>
        )}
    </div>
);
