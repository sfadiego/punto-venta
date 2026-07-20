import { Minus, Plus, Trash2 } from "lucide-react";
import { ICartItem, IMenuProduct } from "@/models/IMenu";
import { CartItemNote } from "./CartItemNote";
import { WeightControls } from "../ProductSelector/WeightControls/WeightControls";
import { isWeightUnit, formatPricePerUnit } from "@/utils/weightUnits";

interface CartItemProps {
    item: ICartItem;
    primaryColor: string;
    onAdd: (product: IMenuProduct) => void;
    onRemove: (productId: number) => void;
    onDelete: (productId: number) => void;
    onSetWeight: (productId: number, weight: number) => void;
    onNote: (productId: number, note: string) => void;
}

export const CartItem = ({ item, primaryColor, onAdd, onRemove, onDelete, onSetWeight, onNote }: CartItemProps) => {
    const unit = item.product.unidad_medida;
    const byWeight = isWeightUnit(unit);
    const subtotal = item.product.precio * item.cantidad;

    return (
        <div className="py-2 border-b border-stone-100 last:border-0">
            <div className="flex items-center justify-between gap-3">
                {/* Nombre y precio por unidad */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                        {item.product.nombre}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                        {byWeight
                            ? formatPricePerUnit(item.product.precio, unit)
                            : `$${item.product.precio.toFixed(2)} c/u`}
                    </p>
                </div>

                {/* Subtotal + borrar */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-stone-800 w-14 text-right tabular-nums">
                        ${subtotal.toFixed(2)}
                    </span>
                    <button
                        onClick={() => onDelete(item.product.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 active:text-red-500 transition-colors"
                        aria-label="Eliminar producto"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Controles de cantidad */}
            <div className={`mt-2 ${byWeight ? "flex justify-end" : ""}`}>
                {byWeight ? (
                    <div className="w-full sm:w-64">
                        <WeightControls
                            cantidad={item.cantidad}
                            unit={unit}
                            precio={item.product.precio}
                            primaryColor={primaryColor}
                            onChangeWeight={(weight) => onSetWeight(item.product.id, weight)}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onRemove(item.product.id)}
                            className="w-9 h-9 rounded-xl bg-stone-100 active:bg-stone-200 flex items-center justify-center transition-colors"
                            aria-label="Quitar"
                        >
                            <Minus size={14} className="text-stone-600" />
                        </button>

                        <span className="text-sm font-semibold w-5 text-center tabular-nums">
                            {item.cantidad}
                        </span>

                        <button
                            onClick={() => onAdd(item.product)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70"
                            style={{ backgroundColor: primaryColor }}
                            aria-label="Agregar"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>

            <CartItemNote
                observacion={item.observacion}
                onSave={(note) => onNote(item.product.id, note)}
            />
        </div>
    );
};
