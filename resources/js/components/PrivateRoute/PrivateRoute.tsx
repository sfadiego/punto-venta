import { useAxios } from "@/hooks/useAxios";
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
    const { isAuth, user } = useAxios();

    if (!isAuth) {
        if (route.publicFallback) {
            window.location.replace(route.publicFallback);
            return null;
        }

        return <Navigate to="/auth" replace />;
    }

    if (route.hasPermission !== undefined && !route.hasPermission(user!)) {
        return <Navigate to="/forbidden" replace />;
    }

    return React.isValidElement(element) ? element : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
