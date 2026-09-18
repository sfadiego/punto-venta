import * as Yup from "yup";

// Un producto por unidad se cuenta en piezas — un delta fraccionario (ej. "10.5") no tiene
// sentido de negocio. Mismo criterio que ProductImportService::resolveRow() en el backend
// (importación por CSV) — compartido entre los dos modales de ajuste de stock del frontend
// (Productos e Inventario) para no repetir la misma regla/mensaje dos veces.
export const integerForUnitTest = (isWeightProduct: boolean): Yup.TestConfig<number | undefined> => ({
    name: "integer-for-unit",
    message: "Los productos por unidad no aceptan cantidades decimales",
    test: (delta) => isWeightProduct || delta === undefined || Number.isInteger(delta),
});
