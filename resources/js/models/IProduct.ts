import { ICategory } from "@/models/ICategory";
import { IFileProps } from "@/intefaces/IFileProps";
import { IProductVariant } from "@/models/IProductVariant";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export interface IProduct {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string;
    foto_id: number | null;
    picture: IFileProps;
    categoria_id: number;
    category: ICategory;
    activo: boolean;
    unidad_medida: UnidadMedidaEnum;
    variants?: IProductVariant[];
    // decimales del backend (cast decimal:2) llegan como string, no number
    manage_stock: boolean;
    stock: string | null;
    min_stock: string | null;
    product_code: string | null;
}
