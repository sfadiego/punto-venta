import { SidebarBrand } from "./SidebarBrand";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";

interface SidebarProps {
    open: boolean;
    desktopHidden?: boolean;
    onClose: () => void;
    onLogout: () => void;
    userName: string;
    userRole: string;
    onDesktopToggle?: () => void;
}

export function Sidebar({ open, desktopHidden = false, onClose, onLogout, userName, userRole, onDesktopToggle }: SidebarProps) {
    return (
        <aside
            style={{ backgroundColor: "var(--color-sidebar)" }}
            className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${open ? "translate-x-0" : "-translate-x-full"}
                ${desktopHidden ? "" : "lg:relative lg:translate-x-0"}`}
        >
            <SidebarBrand onClose={onClose} onDesktopToggle={onDesktopToggle} />
            <SidebarNav onItemClick={onClose} />
            <SidebarUser name={userName} role={userRole} onLogout={onLogout} />
        </aside>
    );
}
