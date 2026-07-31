import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AppThemeEnum } from "@/enums/AppThemeEnum";

interface IPublicAppTheme {
    theme: AppThemeEnum;
}

// Público — usado desde AuthPage (sin sesión de tenant ni de super-admin)
export const useGetPublicAppTheme = () =>
    useGET<IPublicAppTheme>({ url: ApiRoutes.AppTheme, nameQuery: ApiRoutes.AppTheme });
