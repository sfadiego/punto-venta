import { NavLink } from "react-router-dom";
import { NavItem } from "./navItems";

interface SidebarNavItemProps {
    item: NavItem;
    onClick: () => void;
}

export function SidebarNavItem({ item, onClick }: SidebarNavItemProps) {
    return (
        <NavLink
            to={item.path}
            end={item.path === "/"}
            onClick={onClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-white/10"
            style={({ isActive }) =>
                isActive
                    ? { backgroundColor: "var(--color-primary)", color: "var(--color-font)" }
                    : { color: "color-mix(in srgb, var(--color-font) 65%, transparent)" }
            }
        >
            <item.icon size={18} />
            {item.label}
        </NavLink>
    );
}
