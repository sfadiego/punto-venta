import { useState } from "react";
import { LogOut, Repeat } from "lucide-react";
import { SwitchBranchModal } from "@/components/BranchSelectionGate/SwitchBranchModal";

interface SidebarUserProps {
    name: string;
    role: string;
    branchName?: string | null;
    canSwitchBranch?: boolean;
    onLogout: () => void;
}

export function SidebarUser({ name, role, branchName, canSwitchBranch, onLogout }: SidebarUserProps) {
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="px-3 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-font)" }}
                    >
                        {name}
                    </p>
                    <p
                        className="text-xs truncate flex items-center gap-1"
                        style={{ color: "color-mix(in srgb, var(--color-font) 55%, transparent)" }}
                    >
                        <span className="truncate">
                            {role}
                            {branchName && ` · ${branchName}`}
                        </span>
                        {canSwitchBranch && (
                            <button
                                type="button"
                                onClick={() => setIsSwitchModalOpen(true)}
                                className="shrink-0 hover:text-white transition-colors"
                                aria-label="Cambiar sucursal"
                                title="Cambiar sucursal"
                            >
                                <Repeat size={11} />
                            </button>
                        )}
                    </p>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10"
                style={{ color: "color-mix(in srgb, var(--color-font) 55%, transparent)" }}
            >
                <LogOut size={16} />
                Cerrar sesión
            </button>

            <SwitchBranchModal isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)} />
        </div>
    );
}
