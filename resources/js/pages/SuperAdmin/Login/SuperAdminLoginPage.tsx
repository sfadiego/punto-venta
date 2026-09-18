import { Building2, Eye, EyeOff, Loader } from "lucide-react";
import { useState } from "react";
import { useSuperAdminLogin } from "./useSuperAdminLogin";

export default function SuperAdminLoginPage() {
    const { formik } = useSuperAdminLogin();
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                        <Building2 size={28} className="text-white" />
                    </div>
                    <h1 className="text-white text-2xl font-bold">Super Admin</h1>
                    <p className="text-slate-400 text-sm mt-1">{import.meta.env.VITE_APP_NAME} — Panel de control</p>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="bg-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="admin@example.com"
                            className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <p className="text-red-400 text-xs mt-1">{formik.errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                name="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="••••••••"
                                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((p) => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-red-400 text-xs mt-1">{formik.errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={formik.isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
                    >
                        {formik.isSubmitting ? (
                            <Loader size={16} className="animate-spin" />
                        ) : (
                            "Iniciar sesión"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
