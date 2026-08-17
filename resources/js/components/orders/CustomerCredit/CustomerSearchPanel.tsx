import { Search, UserPlus, Lock } from "lucide-react";
import { ICustomer } from "@/models/ICustomer";
import { formatCurrency } from "@/utils/formatCurrency";

interface CustomerSearchPanelProps {
    customers: ICustomer[];
    search: string;
    setSearch: (v: string) => void;
    selectedCustomerId: number | null;
    onSelect: (id: number) => void;
    onOpenNewForm: () => void;
}

export const CustomerSearchPanel = ({
    customers, search, setSearch, selectedCustomerId, onSelect, onOpenNewForm,
}: CustomerSearchPanelProps) => (
    <>
        <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1 border border-stone-100 rounded-xl p-1.5">
            {customers.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-3">Sin clientes que coincidan</p>
            )}
            {customers.map((customer) => {
                const isSelected = customer.id === selectedCustomerId;
                const blocked = !customer.allow_credit;
                return (
                    <button
                        key={customer.id}
                        type="button"
                        disabled={blocked}
                        title={blocked ? "Este cliente no tiene crédito habilitado" : undefined}
                        onClick={() => onSelect(customer.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            blocked
                                ? "opacity-50 cursor-not-allowed bg-stone-50"
                                : isSelected
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-stone-50 text-stone-700"
                        }`}
                    >
                        <span className="truncate">{customer.name}</span>
                        {blocked ? (
                            <Lock size={12} className="shrink-0" />
                        ) : (
                            Number(customer.balance) > 0 && (
                                <span className={`text-xs shrink-0 tabular-nums ${isSelected ? "text-white" : "text-red-500"}`}>
                                    {formatCurrency(Number(customer.balance))}
                                </span>
                            )
                        )}
                    </button>
                );
            })}
        </div>

        <button
            type="button"
            onClick={onOpenNewForm}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
            <UserPlus size={13} />
            Nuevo cliente
        </button>
    </>
);
