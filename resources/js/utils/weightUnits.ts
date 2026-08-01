import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";

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

const formatPrice = (precio: number): string => String(parseFloat(precio.toFixed(2)));

export const formatPricePerUnit = (precio: number, unit: WeightUnit): string =>
    `$${formatPrice(precio)}/${UNIDAD_LABELS[unit]}`;
