import { IconSourceEnum } from "@/enums/IconSourceEnum";

export interface ICategory {
    id?: number;
    nombre: string;
    orden?: number;
    foto_id?: number;
    icon_name?: string;
    icon_source?: IconSourceEnum;
}
