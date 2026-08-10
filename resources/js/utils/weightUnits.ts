import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

export type WeightUnit = UnidadMedidaEnum.Kg | UnidadMedidaEnum.Gr | UnidadMedidaEnum.Litro;

export const isWeightUnit = (unit: string | null | undefined): unit is WeightUnit =>
    unit === UnidadMedidaEnum.Kg || unit === UnidadMedidaEnum.Gr || unit === UnidadMedidaEnum.Litro;

export const weightStep = (unit: WeightUnit): number =>
    unit === UnidadMedidaEnum.Gr ? 100 : 0.5;

export const weightMin = (unit: WeightUnit): number =>
    unit === UnidadMedidaEnum.Gr ? 100 : 0.1;

export const weightMax = (unit: WeightUnit): number =>
    unit === UnidadMedidaEnum.Gr ? 50000 : 50;

export const formatWeight = (cantidad: number, unit: WeightUnit): string =>
    unit === UnidadMedidaEnum.Gr
        ? `${Math.round(cantidad)} gr`
        : `${cantidad.toFixed(1)} ${UNIDAD_LABELS[unit]}`;

// Cantidad + unidad con conversión a la subunidad (g/ml) cuando es menor a 1 kg/L, con
// más precisión que formatWeight (2 decimales en vez de 1) — pensado para el ticket de
// venta, donde la cantidad viene de una báscula/calculadora y perder precisión visual
// (ej. redondear 6.75 kg a 6.8 kg) confunde al cajero.
export const formatWeightQuantity = (cantidad: number, unit: WeightUnit): string => {
    if (unit === UnidadMedidaEnum.Gr) {
        return `${Math.round(cantidad)} g`;
    }
    const subunit = unit === UnidadMedidaEnum.Litro ? "ml" : "g";
    return cantidad >= 1
        ? `${cantidad.toFixed(2).replace(/\.?0+$/, "")} ${UNIDAD_LABELS[unit]}`
        : `${Math.round(cantidad * 1000)} ${subunit}`;
};

const formatPrice = (precio: number): string => String(parseFloat(precio.toFixed(2)));

export const formatPricePerUnit = (precio: number, unit: WeightUnit): string =>
    `$${formatPrice(precio)}/${UNIDAD_LABELS[unit]}`;

// Cantidad y precio unitario de una línea de carrito, para cualquier unidad_medida: peso/
// volumen usa formatWeightQuantity/formatPricePerUnit, "unidad" muestra conteo simple y
// precio "c/u" en vez de "/kg".
export const formatCartQuantity = (unit: UnidadMedidaEnum, cantidad: number): string =>
    isWeightUnit(unit) ? formatWeightQuantity(cantidad, unit) : `${cantidad} ${UNIDAD_LABELS[unit]}`;

export const formatCartUnitPrice = (unit: UnidadMedidaEnum, precio: number): string =>
    isWeightUnit(unit) ? formatPricePerUnit(precio, unit) : `${formatCurrencyTrimmed(precio)} c/u`;

export interface WeightChipOption {
    value: number;
    label: string;
}

// Opciones rápidas de cantidad por unidad: gramos usa pasos enteros (100/250/500 g),
// kg y litro comparten la misma escala fraccionaria (250 ml/500 ml/1 L vs 250 g/500 g/1 kg).
export const weightChipOptions = (unit: WeightUnit): WeightChipOption[] => {
    if (unit === UnidadMedidaEnum.Gr) {
        return [
            { value: 100, label: "100 g" },
            { value: 250, label: "250 g" },
            { value: 500, label: "500 g" },
        ];
    }
    if (unit === UnidadMedidaEnum.Litro) {
        return [
            { value: 0.25, label: "250 ml" },
            { value: 0.5, label: "500 ml" },
            { value: 1, label: "1 L" },
        ];
    }
    return [
        { value: 0.25, label: "250 g" },
        { value: 0.5, label: "500 g" },
        { value: 1, label: "1 kg" },
    ];
};
