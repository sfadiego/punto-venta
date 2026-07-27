export type Placement = "bottom-start" | "top-start" | "right-start" | "left-start";
export type Variant = "inline" | "block";

export interface Coords {
    top: number;
    left: number;
    transform?: string;
}

export const POPOVER_WIDTH = 288; // w-72
export const VIEWPORT_MARGIN = 16;

export const VARIANT_CLASSES: Record<Variant, string> = {
    inline: "relative inline-block",
    block: "relative block w-full",
};

export const ARROW_PLACEMENT_CLASSES: Record<Placement, string> = {
    "bottom-start": "-top-1 left-4",
    "top-start": "-bottom-1 left-4",
    "right-start": "top-4 -left-1",
    "left-start": "top-4 -right-1",
};
