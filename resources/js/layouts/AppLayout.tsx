import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar/Sidebar";
import { SidebarMini } from "./Sidebar/SidebarMini";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { PrintAgentProvider } from "@/contexts/PrintAgentContext";
import { BluetoothPrintProvider } from "@/contexts/BluetoothPrintContext";
import { ScaleProvider } from "@/contexts/ScaleContext";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import { useAppLayout } from "./useAppLayout";
import { useAxios } from "@/hooks/useAxios";
import { useBranchList } from "@/services/useBranchService";
import { BranchSelectionGate } from "@/components/BranchSelectionGate/BranchSelectionGate";

interface AppLayoutProps {
    children?: React.ReactNode;
}

const FullPageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

export default function AppLayout({ children }: AppLayoutProps) {
    const { isAuth, user, features, branchId, setBranch } = useAxios();
    useOrdersSocket({
        tenantId: user?.tenant_id,
        showToast: true,
        suppressCreated: features?.sell_by_weight === true,
    });
    // enabled=isAuth: no dispararla mientras no hay sesión (este layout también se monta
    // sin autenticar, ver el `if (!isAuth)` de abajo).
    const { data: branches, isLoading: isLoadingBranches } = useBranchList(isAuth);

    // La sucursal activa de esta sesión pudo haber sido desactivada mientras la app
    // seguía abierta (branches ya no la incluye, filtra por active=true) — se limpia
    // para forzar a elegir una válida en vez de dejar al usuario operando (o
    // intentando abrir caja/crear productos) contra una sucursal que ya no existe.
    useEffect(() => {
        if (!isAuth || isLoadingBranches || !branchId || !branches) return;
        if (!branches.some((branch) => branch.id === branchId)) {
            setBranch(null);
        }
    }, [isAuth, isLoadingBranches, branchId, branches, setBranch]);

    // Única sucursal autorizada: se autoselecciona apenas carga el layout, sin esperar a
    // que el usuario abra caja o pase por BranchSelectionGate (ese gate solo bloquea con
    // 2+ sucursales) — así el nombre de sucursal en el sidebar aparece de inmediato en
    // vez de quedar vacío hasta la primera apertura de caja de la sesión.
    useEffect(() => {
        if (!isAuth || isLoadingBranches || branchId || branches?.length !== 1) return;
        setBranch(branches[0].id);
    }, [isAuth, isLoadingBranches, branchId, branches, setBranch]);

    const {
        sidebarOpen,
        setSidebarOpen,
        desktopCollapsed,
        desktopSidebarHidden,
        sidebarDesktopHidden,
        handleMiniExpand,
        handleMenuClick,
        handleDesktopToggle,
        handleLogout,
        userName,
        userRole,
        config,
    } = useAppLayout();

    if (!isAuth) return <Outlet />;

    // Más de una sucursal autorizada y ninguna elegida todavía en esta sesión: bloquea el
    // resto de la app hasta que el usuario elija con cuál trabajar. Con una sola sucursal
    // no llega aquí — el resto del flujo (OpenSalesModal, etc.) la autoselecciona sola.
    if (isLoadingBranches) return <FullPageLoader />;
    if (!branchId && (branches?.length ?? 0) > 1) return <BranchSelectionGate />;

    // Solo se muestra si el tenant tiene la feature activa — mismo flag ya usado como
    // gate en SidebarMini.tsx para el ítem "Sucursales".
    const branchName = config?.multi_branch_enabled === true
        ? branches?.find((branch) => branch.id === branchId)?.name ?? null
        : null;
    // El gate inicial solo aparece con branchId vacío — si el Admin otorga una sucursal
    // adicional a mitad de sesión, branchId sigue siendo válido y el gate no se repite.
    // Este switcher manual cubre ese hueco.
    const canSwitchBranch = config?.multi_branch_enabled === true && (branches?.length ?? 0) > 1;

    return (
        <PrintAgentProvider enabled={import.meta.env.VITE_APP_ENV === "local" || !!config?.printer_enabled}>
        <BluetoothPrintProvider enabled={!!config?.bluetooth_printing_enabled}>
        <ScaleProvider enabled={features?.sell_by_weight === true}>
        <LayoutProvider onToggleSidebar={handleMenuClick}>
            <div className="flex h-dvh bg-stone-50 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {!desktopSidebarHidden && (
                    <SidebarMini
                        userName={userName}
                        branchName={branchName}
                        desktopVisible={desktopCollapsed}
                        onExpand={handleMiniExpand}
                        onLogout={handleLogout}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    desktopHidden={sidebarDesktopHidden}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={handleLogout}
                    userName={userName}
                    userRole={userRole}
                    branchName={branchName}
                    canSwitchBranch={canSwitchBranch}
                    onDesktopToggle={desktopSidebarHidden ? undefined : handleDesktopToggle}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto">{children ?? <Outlet />}</main>
                </div>
            </div>
        </LayoutProvider>
        </ScaleProvider>
        </BluetoothPrintProvider>
        </PrintAgentProvider>
    );
}
