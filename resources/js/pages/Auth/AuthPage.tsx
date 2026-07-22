import { ShoppingCart, ArrowRight, CheckCircle, BarChart2, ShoppingBag, Zap } from "lucide-react";
import { useAuthPage } from "./useAuthPage";
import { useNavigate } from "react-router-dom";

const FEATURES = [
    { icon: ShoppingCart, label: "Punto de venta", desc: "Gestión rápida de pedidos y cobros" },
    { icon: ShoppingBag, label: "Control de ventas", desc: "Cortes de caja, historial y resúmenes" },
    { icon: BarChart2, label: "Estadísticas", desc: "Productos más vendidos y reportes" },
    { icon: Zap, label: "Multi-negocio", desc: "Restaurantes, carnicerías y más" },
];

export default function AuthPage() {
    const appName = import.meta.env.VITE_APP_NAME;
    const { slug, setSlug, goToClientAuth, handleDemoRequest, submitted } = useAuthPage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Panel izquierdo — branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full" />
                    <div className="absolute bottom-16 right-12 w-72 h-72 bg-white rounded-full" />
                    <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col items-start max-w-sm w-full">
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-5 mb-8 shadow-xl">
                        <ShoppingCart onClick={() => navigate('/')} size={48} className="text-white cursor-pointer" />
                    </div>
                    <h1 className="text-white text-4xl font-bold tracking-tight mb-3">{appName}</h1>
                    <p className="text-amber-100 text-base leading-relaxed mb-10">
                        Sistema de punto de venta diseñado para negocios que quieren vender más y administrar mejor.
                    </p>

                    <div className="grid grid-cols-1 gap-4 w-full">
                        {FEATURES.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">{label}</p>
                                    <p className="text-amber-200 text-xs">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Panel derecho — acciones */}
            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm space-y-8">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex justify-center">
                        <div className="bg-amber-500 rounded-2xl p-4 shadow-lg">
                            <ShoppingCart size={36} className="text-white" />
                        </div>
                    </div>

                    {/* Acceso a cliente existente */}
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 mb-1">Accede a tu negocio</h2>
                        <p className="text-stone-500 text-sm mb-4">Ingresa el identificador de tu negocio</p>

                        <form onSubmit={goToClientAuth} className="flex gap-2">
                            <input
                                type="text"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                placeholder="mi-negocio"
                                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                                    focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            />
                            <button
                                type="submit"
                                disabled={!slug.trim()}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40
                                    text-white rounded-xl transition-colors"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-100" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-xs text-stone-400">¿No tienes cuenta?</span>
                        </div>
                    </div>

                    {/* Solicitar demo */}
                    {submitted ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <CheckCircle size={40} className="text-emerald-500" />
                            <p className="text-stone-700 font-medium">¡Solicitud recibida!</p>
                            <p className="text-stone-400 text-sm">
                                Nos pondremos en contacto contigo pronto para coordinar tu demo.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-semibold text-stone-700 mb-1">Solicitar demo gratuita</h3>
                            <p className="text-stone-400 text-xs mb-4">Te contactamos en menos de 24 horas</p>

                            <form onSubmit={handleDemoRequest} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Nombre del negocio"
                                    required
                                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                                        focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                />
                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    required
                                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                                        focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono (opcional)"
                                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                                        focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                />
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white
                                        rounded-xl text-sm font-medium transition-colors"
                                >
                                    Solicitar demo
                                </button>
                            </form>
                        </div>
                    )}

                    <p className="text-center text-stone-300 text-xs">
                        {appName} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
