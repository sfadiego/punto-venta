import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export type WeightUnit = UnidadMedidaEnum.Kg | UnidadMedidaEnum.Gr;

export const isWeightUnit = (unit: string | null | undefined): unit is WeightUnit =>
    unit === UnidadMedidaEnum.Kg || unit === UnidadMedidaEnum.Gr;

export const weightStep = (unit: WeightUnit): number =>
    unit === UnidadMedidaEnum.Kg ? 0.5 : 100;

export const weightMin = (unit: WeightUnit): number =>
    unit === UnidadMedidaEnum.Kg ? 0.1 : 100;

export const formatWeight = (cantidad: number, unit: WeightUnit): string =>
    unit === UnidadMedidaEnum.Kg
        ? `${cantidad.toFixed(1)} kg`
        : `${Math.round(cantidad)} gr`;

const formatPrice = (precio: number): string => String(parseFloat(precio.toFixed(2)));

export const formatPricePerUnit = (precio: number, unit: WeightUnit): string =>
    `$${formatPrice(precio)}/${unit}`;
