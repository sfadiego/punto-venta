import { Lock } from "lucide-react";
import { IUser } from "@/models/IUser";
import { useLoginLockStatus } from "@/services/useTenantUserService";

interface UserStatusCellProps {
    user: IUser;
    tenantId: number;
}

export const UserStatusCell = ({ user, tenantId }: UserStatusCellProps) => {
    const { data: lockStatus } = useLoginLockStatus(tenantId, user.id);

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span
                className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                    user.activo ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
            >
                {user.activo ? "Activo" : "Inactivo"}
            </span>
            {lockStatus?.blocked && (
                <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-600"
                    title="Bloqueado temporalmente por intentos fallidos de login. Se libera solo en menos de 1 minuto."
                >
                    <Lock size={11} />
                    Bloqueado
                </span>
            )}
        </div>
    );
};
