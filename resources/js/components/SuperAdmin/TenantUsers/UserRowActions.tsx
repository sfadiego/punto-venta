import { Pencil, Trash2, LockOpen } from "lucide-react";
import { IUser } from "@/models/IUser";
import { useUserRowActions } from "./useUserRowActions";

interface UserRowActionsProps {
    user: IUser;
    tenantId: number;
    onEdit: (user: IUser) => void;
    onDelete: (user: IUser) => void;
}

export const UserRowActions = ({ user, tenantId, onEdit, onDelete }: UserRowActionsProps) => {
    const { isBlocked, isUnblocking, handleUnblock } = useUserRowActions(tenantId, user);

    return (
        <div className="flex items-center justify-center gap-1">
            {isBlocked && (
                <button
                    onClick={handleUnblock}
                    disabled={isUnblocking}
                    title="Desbloquear acceso (emergencia)"
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                >
                    <LockOpen size={20} />
                </button>
            )}
            <button
                onClick={() => onEdit(user)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
            >
                <Pencil size={20} />
            </button>
            <button
                onClick={() => onDelete(user)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
                <Trash2 size={20} />
            </button>
        </div>
    );
};
