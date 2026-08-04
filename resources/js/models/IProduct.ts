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
}
