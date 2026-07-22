import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export default function RegisterPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">Registro</h1>
                <p className="text-stone-500 text-sm mb-6">
                    El registro de usuarios lo gestiona el administrador del sistema.
                </p>
                <button
                    onClick={() => navigate("/auth")}
                    className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
                >
                    Volver al inicio de sesión
                </button>
            </div>
        </div>
    );
}
