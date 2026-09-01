// Anchos fijos compartidos entre las columnas del DataTable de productos (ProductsPage) y las
// "celdas" de VariantStockExpansion (fila expandida) — con anchos fijos en ambos lados, las
// sub-filas de variantes quedan siempre alineadas con las columnas del producto padre, sin
// importar el largo del contenido.
export const PRODUCT_TABLE_COLUMN_WIDTHS = {
    icon: 52,
    nombre: 280,
    categoria: 160,
    precio: 140,
    estado: 120,
    stock: 100,
    acciones: 150,
} as const;
