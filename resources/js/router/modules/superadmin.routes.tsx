import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { superAdminAuth } from "@/contexts/SuperAdminContext";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";

const SuperAdminLoginPage = lazy(() => import("@/pages/SuperAdmin/Login/SuperAdminLoginPage"));
const TenantListPage      = lazy(() => import("@/pages/SuperAdmin/Tenants/TenantListPage"));
const TenantFormPage      = lazy(() => import("@/pages/SuperAdmin/Tenants/TenantFormPage"));
const TenantUsersPage     = lazy(() => import("@/pages/SuperAdmin/TenantUsers/TenantUsersPage"));
const SubscriptionsPage   = lazy(() => import("@/pages/SuperAdmin/Subscriptions/SubscriptionsPage"));
const SettingsPage        = lazy(() => import("@/pages/SuperAdmin/Settings/SettingsPage"));
const ErrorLogsPage       = lazy(() => import("@/pages/SuperAdmin/ErrorLogs/ErrorLogsPage"));
const DemoRequestsPage    = lazy(() => import("@/pages/SuperAdmin/DemoRequests/DemoRequestsPage"));

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) =>
    superAdminAuth.isAuthenticated() ? <>{children}</> : <Navigate to={SuperAdminRoutes.Login} replace />;

export const superAdminRoutes = [
    {
        path: SuperAdminRoutes.Login,
        element: <SuperAdminLoginPage />,
    },
    {
        path: SuperAdminRoutes.Tenants,
        element: <SuperAdminRoute><TenantListPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.NewTenant,
        element: <SuperAdminRoute><TenantFormPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.EditTenant,
        element: <SuperAdminRoute><TenantFormPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.TenantUsers,
        element: <SuperAdminRoute><TenantUsersPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.Subscriptions,
        element: <SuperAdminRoute><SubscriptionsPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.Settings,
        element: <SuperAdminRoute><SettingsPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.ErrorLogs,
        element: <SuperAdminRoute><ErrorLogsPage /></SuperAdminRoute>,
    },
    {
        path: SuperAdminRoutes.DemoRequests,
        element: <SuperAdminRoute><DemoRequestsPage /></SuperAdminRoute>,
    },
];
