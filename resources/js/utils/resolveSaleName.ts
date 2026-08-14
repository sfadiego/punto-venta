// Sufijo alfanumérico corto además de los segundos: dos ventas cerradas en el mismo
// segundo desde terminales distintas (u órdenes en la misma petición) igual generarían
// el mismo folio si solo se usara la marca de tiempo. La fecha completa no hace falta en
// el folio — la orden ya queda timestampada en la base de datos — así que solo se usa la
// hora para mantenerlo corto.
const randomSuffix = (): string => Math.random().toString(36).slice(2, 4).toUpperCase();

export const resolveSaleName = (nombrePedido: string): string => {
    if (nombrePedido.trim()) return nombrePedido.trim();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `VTA-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${randomSuffix()}`;
};
