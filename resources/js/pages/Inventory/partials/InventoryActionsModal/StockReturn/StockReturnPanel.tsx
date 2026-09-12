import { FormikProps } from "formik";
import { IOrder, IOrderSummary } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { StockReturnForm } from "./useStockReturnPanel";
import { OrderAutocomplete } from "./OrderAutocomplete";
import { SelectReturnLine } from "./SelectReturnLine";

interface StockReturnPanelProps {
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
}

export const StockReturnPanel = ({
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
}: StockReturnPanelProps) => (
    <div className="space-y-4">
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

                <button
                    type="submit"
                    disabled={formik.isSubmitting || !canSubmit}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {formik.isSubmitting ? "Guardando..." : "Devolver"}
                </button>
            </form>
        )}
    </div>
);
