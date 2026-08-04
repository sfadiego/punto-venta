import type { ComponentProps } from "react";
import { DynamicIcon as LucideDynamicIcon, iconNames } from "lucide-react/dynamic";
import { Package, LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
    name: string;
}

// "icon_name" se guarda en PascalCase (ej. "ShoppingCart", como en lucide.dev),
// pero el mapa de imports dinámicos de lucide-react usa claves kebab-case
// ("shopping-cart"). Mismo algoritmo de conversión que usa lucide internamente.
const toKebabCase = (name: string): string =>
    name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();

const validIconNames = new Set<string>(iconNames);

// A diferencia de un `import * as LucideIcons from "lucide-react"` (que mete
// las ~1500 íconos del paquete en un solo chunk), esto carga solo el ícono que
// se está usando vía import() dinámico — ver dynamicIconImports de lucide-react.
//
// Si el nombre (dato legado, categoría sin ícono guardado como "" en vez de
// null, o un ícono renombrado/eliminado en una actualización de lucide-react)
// no existe en el set de íconos dinámicos, renderizamos el fallback directo
// en vez de dejarle el nombre a LucideDynamicIcon — evita que lucide lance y
// loguee internamente un console.error en cada render inválido.
export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
    const kebabName = toKebabCase(name);

    if (!validIconNames.has(kebabName)) {
        return <Package {...props} />;
    }

    return (
        <LucideDynamicIcon
            name={kebabName as ComponentProps<typeof LucideDynamicIcon>["name"]}
            fallback={() => <Package {...props} />}
            {...props}
        />
    );
};
