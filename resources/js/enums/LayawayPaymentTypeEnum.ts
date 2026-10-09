export enum LayawayPaymentTypeEnum {
    Deposit = "deposit",
    Refund  = "refund",
    // Parte del anticipo que el negocio retiene al cancelar: va al historial, no mueve la caja.
    Forfeit = "forfeit",
}
