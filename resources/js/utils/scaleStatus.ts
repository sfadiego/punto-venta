export const getScaleStatusLabel = (isSupported: boolean, isBusy: boolean, isPaired: boolean): string => {
    if (!isSupported) return "No disponible";
    if (isBusy) return "Leyendo…";
    if (isPaired) return "Báscula conectada";
    return "Toca para conectar";
};
