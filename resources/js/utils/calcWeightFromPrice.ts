export const calcWeightFromPrice = (price: number | string, unitPrice: number): number => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (!numPrice || unitPrice <= 0) return 0;
    return numPrice / unitPrice;
};
