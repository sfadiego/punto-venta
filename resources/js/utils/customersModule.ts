import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";
import { IBusinessConfig } from "@/models/IBusinessConfig";

/**
 * Si el módulo de clientes (y la venta a crédito) está disponible para el negocio: siempre en venta
 * por peso y en retail (en retail es parte del flujo — apartados, historial de abonos), y en el resto
 * de los tipos según business_config.customers_enabled. Único lugar donde se decide, para que el
 * sidebar, el cobro y el cierre de caja no se desincronicen.
 */
export const isCustomersModuleEnabled = (
    features?: IBusinessFeatures | null,
    config?: Pick<IBusinessConfig, "customers_enabled"> | null,
): boolean => features?.sell_by_weight === true || features?.is_retail === true || config?.customers_enabled === true;
