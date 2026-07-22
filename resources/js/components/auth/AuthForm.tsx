import { useAuth } from "./useAuth";
import { Input } from "../ui/form/Input";

export const AuthForm = () => {
    const { formik, loginMutation } = useAuth();

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
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
