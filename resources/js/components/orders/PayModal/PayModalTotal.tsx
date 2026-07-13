interface PayModalTotalProps {
    subtotal: number;
}

export const PayModalTotal = ({ subtotal }: PayModalTotalProps) => (
    <div className="bg-stone-50 rounded-xl p-4 text-center">
        <p className="text-xs text-stone-500 mb-1">Total a cobrar</p>
        <p className="text-3xl font-bold text-stone-900 tabular-nums">
            ${subtotal.toFixed(2)}
        </p>
    </div>
);
