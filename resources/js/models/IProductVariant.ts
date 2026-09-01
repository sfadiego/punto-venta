export interface IProductVariant {
    id: number;
    product_id: number;
    nombre: string;
    precio: number;
    orden: number;
    activo: boolean;
    stock: string | null;
    min_stock: string | null;
}
