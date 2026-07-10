export enum AdminRoutes {
    Dashboard    = "/",
    CloseSales   = "/close-sales",
    ProductsPage = "/products",
    OrderList    = "/orders",
    TakeOrder    = "/take-order/:id",
    CategoryList = "/categories",
    Statistics   = "/statistics",
    SaleList     = "/sales",
    Admin        = "/admin",
    Subscription = "/subscription",
    TenantLogin  = "/:slug/login",
}

export enum SuperAdminRoutes {
    Login         = "/admin/login",
    Tenants       = "/admin/tenants",
    NewTenant     = "/admin/tenants/new",
    EditTenant    = "/admin/tenants/:id",
    TenantUsers   = "/admin/tenants/:id/users",
    Subscriptions = "/admin/subscriptions",
    Settings      = "/admin/settings",
    ErrorLogs     = "/admin/error-logs",
}
