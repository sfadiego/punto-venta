import { RoleEnum } from "@/enums/RoleEnum";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

// Cocina y Caja no existen como roles asignables en negocios de venta por peso ni en retail —
// ninguno tiene kitchen_view ni un flujo de caja separado del empleado. Debe reflejar
// BusinessConfigModel::excludesCocinaCajaRoles() (backend, única fuente de verdad de esta
// regla — este helper solo evita repetirla en cada consumidor del frontend).
export const getExcludedRoles = (features?: IBusinessFeatures | null): RoleEnum[] => {
    const excludesCocinaCaja = features?.sell_by_weight === true || features?.is_retail === true;

    return excludesCocinaCaja ? [RoleEnum.Cocina, RoleEnum.Caja] : [];
};
