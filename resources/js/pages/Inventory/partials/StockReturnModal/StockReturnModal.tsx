import { X } from "lucide-react";
import { FormikProps } from "formik";
import { IOrder, IOrderSummary } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { StockReturnForm } from "./useStockReturnModal";
import { OrderAutocomplete } from "./OrderAutocomplete";
import { SelectReturnLine } from "./SelectReturnLine";

interface StockReturnModalProps {
    isOpen: boolean;
    query: string;
    handleQueryChange: (value: string) => void;
    suggestions: IOrderSummary[];
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    selectOrder: (order: IOrderSummary) => void;
    order: IOrder | null;
    isLoadingOrder: boolean;
    isOrderClosed: boolean;
    lines: IOrderProduct[];
    orderProductId: number | null;
    setOrderProductId: (id: number | null) => void;
    canSubmit: boolean;
    formik: FormikProps<StockReturnForm>;
    onClose: () => void;
}

export const StockReturnModal = ({
    isOpen,
    query,
    handleQueryChange,
    suggestions,
    isDropdownOpen,
    setIsDropdownOpen,
    selectOrder,
    order,
    isLoadingOrder,
    isOrderClosed,
    lines,
    orderProductId,
    setOrderProductId,
    canSubmit,
    formik,
    onClose,
}: StockReturnModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">Devolución de producto</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <OrderAutocomplete
                        value={query}
                        onChange={handleQueryChange}
                        suggestions={suggestions}
                        isOpen={isDropdownOpen}
                        setIsOpen={setIsDropdownOpen}
                        onSelect={selectOrder}
                    />

                    {isLoadingOrder && <p className="text-sm text-stone-400">Cargando orden...</p>}
                    {order && !isOrderClosed && (
                        <p className="text-sm text-red-500">Solo se pueden devolver productos de órdenes ya cerradas.</p>
                    )}

                    {order && isOrderClosed && (
                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            <SelectReturnLine
                                lines={lines}
                                value={orderProductId ? String(orderProductId) : ""}
                                onChange={(value) => setOrderProductId(Number(value))}
                            />

                            <Input<StockReturnForm>
                                name="quantity"
                                label="Cantidad a devolver *"
                                inputType="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                formik={formik}
                                disabled={!orderProductId}
                            />

                            <Textarea<StockReturnForm>
                                name="note"
                                label="Nota (opcional)"
                                placeholder="Ej: producto defectuoso"
                                formik={formik}
                                rows={2}
                            />

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formik.isSubmitting || !canSubmit}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formik.isSubmitting ? "Guardando..." : "Devolver"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
