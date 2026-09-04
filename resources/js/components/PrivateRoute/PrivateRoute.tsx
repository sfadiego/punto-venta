import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import IRoute from "@/intefaces/IRoutes";
import React, { ReactElement } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({
    element,
    route,
}: {
    element: ReactElement;
    route: IRoute;
}) => {
    const { isAuth } = useAxios();
    const { can } = usePermissions();

    if (!isAuth) {
        if (route.publicFallback) {
            window.location.replace(route.publicFallback);
            return null;
        }

        return <Navigate to="/auth" replace />;
    }

    const requiredPermissions = route.permission === undefined
        ? []
        : Array.isArray(route.permission) ? route.permission : [route.permission];

    if (!requiredPermissions.every((permission) => can(permission))) {
        return <Navigate to="/forbidden" replace />;
    }

    return React.isValidElement(element) ? element : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
