import { AlertTriangle } from "lucide-react";
import { useAuth } from "./useAuth";
import { Input } from "../ui/form/Input";

export const AuthForm = () => {
    const { formik, loginMutation, banner } = useAuth();

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
            {banner && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{banner}</p>
                </div>
            )}
            <Input
                label="Correo electronico"
                inputType="email"
                name="email"
                formik={formik}
                placeholder="correo@ejemplo.com"
            />
            <Input
                label="Contraseña"
                inputType="password"
                name="password"
                formik={formik}
                placeholder="••••••••"
            />
            <button
                type="submit"
                disabled={formik.isSubmitting || loginMutation.isPending}
                className="w-full flex items-center justify-center text-white font-semibold py-3 px-4 rounded-xl transition-opacity duration-150 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--color-primary)" }}
            >
                {loginMutation.isPending ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Ingresando...
                    </>
                ) : (
                    "Iniciar sesion"
                )}
            </button>
        </form>
    );
};
