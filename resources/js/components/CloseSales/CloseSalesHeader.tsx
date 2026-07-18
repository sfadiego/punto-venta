export const CloseSalesHeader = () => (
    <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-stone-900">Cierre de caja</h1>
            <p className="text-stone-500 text-sm mt-0.5">
                Resumen de la sesión de ventas actual
            </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Caja abierta
        </span>
    </div>
);
