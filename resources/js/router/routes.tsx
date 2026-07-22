import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { superAdminRoutes } from "./modules/superadmin.routes";
import AppLayout from "@/layouts/AppLayout";
import PrivateRoute from "@/components/PrivateRoute/PrivateRoute";
import IRoute from "@/intefaces/IRoutes";
import { RoleEnum } from "@/enums/RoleEnum";

const AuthPage         = lazy(() => import("@/pages/Auth/AuthPage"));
const TenantAuthPage   = lazy(() => import("@/pages/Auth/TenantAuthPage"));
const ForbiddenPage    = lazy(() => import("@/pages/OtherPage/Forbidden"));
const DashboardPage    = lazy(() => import("@/pages/Dashboard/DashboardPage"));
const TakeOrderPage    = lazy(() => import("@/pages/Orders/TakeOrderPage"));
const OrderListPage    = lazy(() => import("@/pages/Orders/OrderListPage"));
const ProductsPage     = lazy(() => import("@/pages/Product/ProductsPage"));
const CategoriesPage   = lazy(() => import("@/pages/Category/CategoriesPage"));
const CustomersPage       = lazy(() => import("@/pages/Customers/CustomersPage"));
const CustomerDetailPage  = lazy(() => import("@/pages/Customers/CustomerDetailPage"));
const CloseSalesPage   = lazy(() => import("@/pages/Sales/partials/CloseSales/CloseSalesPage"));
const SalesPage        = lazy(() => import("@/pages/Sales/SalesPage"));
const StatisticsPage   = lazy(() => import("@/pages/Statistics/StatisticsPage"));
const AdminPage        = lazy(() => import("@/pages/Admin/AdminPage"));
const UsersPage        = lazy(() => import("@/pages/Users/UsersPage"));
const SubscriptionPage = lazy(() => import("@/pages/Subscription/SubscriptionPage"));
const MenuPage         = lazy(() => import("@/pages/Menu/MenuPage"));

const PageLoader = () => (
    <div className="flex items-center justify-center h-full min-h-32">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const FullPageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const allow = (...roles: RoleEnum[]) =>
    (u: { rol_id: number }) => roles.includes(u.rol_id as RoleEnum);

const privateRoutes: IRoute[] = [
    { path: "/",               element: <DashboardPage />,  private: true },
    { path: "/orders",         element: <OrderListPage />,  private: true },
    { path: "/products",       element: <ProductsPage />,   private: true, hasPermission: allow(RoleEnum.Admin, RoleEnum.Employe) },
    { path: "/categories",     element: <CategoriesPage />, private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/customers",      element: <CustomersPage />,      private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/customers/:id",  element: <CustomerDetailPage />, private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/take-order/:id", element: <TakeOrderPage />,  private: true, hasPermission: allow(RoleEnum.Admin, RoleEnum.Employe) },
    { path: "/close-sales",    element: <CloseSalesPage />, private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/sales",          element: <SalesPage />,      private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/statistics",     element: <StatisticsPage />, private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/users",          element: <UsersPage />,        private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/admin",          element: <AdminPage />,        private: true, hasPermission: allow(RoleEnum.Admin) },
    { path: "/subscription",   element: <SubscriptionPage />, private: true },
];

export const router = createBrowserRouter([
    {
        path: "/auth",
        element: (
            <Suspense fallback={<FullPageLoader />}>
                <AuthPage />
            </Suspense>
        ),
    },
    {
        path: "/:slug/auth",
        element: (
            <Suspense fallback={<FullPageLoader />}>
                <TenantAuthPage />
            </Suspense>
        ),
    },
    {
        path: "/:slug/menu",
        element: (
            <Suspense fallback={<FullPageLoader />}>
                <MenuPage />
            </Suspense>
        ),
    },
    // Layout route — AppLayout monta una sola vez y persiste entre rutas
    {
        element: <AppLayout />,
        children: privateRoutes.map((route) => ({
            path: route.path,
            element: (
                <PrivateRoute
                    element={
                        <Suspense fallback={<PageLoader />}>
                            {route.element}
                        </Suspense>
                    }
                    route={route}
                />
            ),
        })),
    },
    ...superAdminRoutes,
    {
        path: "/forbidden",
        element: (
            <Suspense fallback={<FullPageLoader />}>
                <ForbiddenPage />
            </Suspense>
        ),
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);
