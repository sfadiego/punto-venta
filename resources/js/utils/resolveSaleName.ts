export const resolveSaleName = (nombrePedido: string): string => {
    if (nombrePedido.trim()) return nombrePedido.trim();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `VTA-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};
