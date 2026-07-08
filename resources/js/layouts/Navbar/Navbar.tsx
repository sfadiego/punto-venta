import { Menu } from "lucide-react";

interface NavbarProps {
    onMenuClick: () => void;
    showOnDesktop?: boolean;
}

export function Navbar({ onMenuClick, showOnDesktop = false }: NavbarProps) {
    return (
        <header className={`${showOnDesktop ? "flex" : "flex lg:hidden"} bg-white border-b border-stone-200 px-4 py-3 items-center gap-3 flex-shrink-0`}>
            <button
                onClick={onMenuClick}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu size={20} />
            </button>
        </header>
    );
}
