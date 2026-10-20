import { Navigate, useParams } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { TenantAuthContent } from "./partials/TenantAuthContent";

export default function TenantAuthPage() {
    const { slug = "" } = useParams<{ slug: string }>();
    const { isAuth } = useAxios();

    // Sesión activa del mismo negocio (ej. acceso directo de escritorio): va al dashboard
    // sin montar el contenido, para no pedir el branding ni mostrar el login.
    // Si el slug difiere del de la sesión se muestra el login para poder cambiar de negocio.
    if (isAuth && slug === localStorage.getItem("tenantSlug")) {
        return <Navigate to={AdminRoutes.Dashboard} replace />;
    }

    return <TenantAuthContent slug={slug} />;
}
