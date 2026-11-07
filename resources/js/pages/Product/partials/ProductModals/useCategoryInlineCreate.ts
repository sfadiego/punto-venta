import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { RoleEnum } from "@/enums/RoleEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { ICategory } from "@/models/ICategory";
import { invalidateCategoryQueries, useStoreCategory } from "@/services/useCategoriesService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { capitalizeFirstLetter } from "@/utils/textCase";

const MAX_NAME_LENGTH = 70;

// Alta de categoría desde el selector del producto. Solo el Admin puede crearlas (POST /category es
// role.admin): para los demás devuelve undefined y el selector no ofrece la opción. La función
// devuelve el id creado (o null si falló) una vez que la lista de categorías ya se refrescó.
export const useCategoryInlineCreate = (categoryCount: number) => {
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();
    const { mutateAsync: storeCategory } = useStoreCategory();

    if (!hasRole(RoleEnum.Admin)) return undefined;

    return async (nombre: string): Promise<number | null> => {
        const name = capitalizeFirstLetter(nombre);
        if (name.length > MAX_NAME_LENGTH) {
            toast.error(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
            return null;
        }

        try {
            const res = await storeCategory({ nombre: name, orden: categoryCount + 1 });
            const created = (res as unknown as { data: { data: ICategory } }).data.data;
            await invalidateCategoryQueries(queryClient);
            toast.success("Categoría creada");
            return created.id ?? null;
        } catch (error) {
            logUnexpectedError(error, "useCategoryInlineCreate");
            toast.error(getUserFacingErrorMessage(error, "No se pudo crear la categoría"));
            return null;
        }
    };
};
