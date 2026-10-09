// Motivo de una devolución (retail). Refleja app/Enums/ReturnReasonEnum.php — el motivo decide el
// destino de la pieza: una defectuosa no vuelve al stock vendible, se da de baja como merma.
export enum ReturnReasonEnum {
    Defective = "defective",
    NotWanted = "not_wanted",
    Other = "other",
}

export const RETURN_REASON_LABELS: Record<ReturnReasonEnum, string> = {
    [ReturnReasonEnum.Defective]: "Producto defectuoso",
    [ReturnReasonEnum.NotWanted]: "No era lo que esperaba",
    [ReturnReasonEnum.Other]: "Otro motivo",
};
