interface PayModalTotalSummaryProps {
    totalFinal: number;
    subtotal?: number;
    domicilio: number;
    domicilioActivo: boolean;
    customerPays: boolean;
}

export const PayModalTotalSummary = ({
    totalFinal, subtotal, domicilio, domicilioActivo, customerPays,
}: PayModalTotalSummaryProps) => {
    const showBreakdown = domicilioActivo && domicilio > 0 && subtotal !== undefined;

    if (!showBreakdown) {
        return (
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
                <span className="text-sm text-stone-500">Total a cobrar</span>
                <span className="text-xl font-bold text-stone-900">${totalFinal.toFixed(2)}</span>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 py-2 border-b border-stone-100">
            <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Subtotal</span>
                <span className="text-sm text-stone-600">${subtotal!.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">
                    {customerPays ? "Domicilio (cliente paga)" : "Domicilio (a cuenta de negocio)"}
                </span>
                <span className={`text-sm font-medium ${customerPays ? "text-amber-600" : "text-stone-400"}`}>
                    {customerPays ? `+$${domicilio.toFixed(2)}` : `-$${domicilio.toFixed(2)}`}
                </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-stone-100">
                <span className="text-sm font-semibold text-stone-700">Total a cobrar</span>
                <span className="text-xl font-bold text-stone-900">${totalFinal.toFixed(2)}</span>
            </div>
        </div>
    );
};
