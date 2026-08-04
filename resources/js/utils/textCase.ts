export const capitalizeFirstLetter = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (trimmed === trimmed.toUpperCase()) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};
