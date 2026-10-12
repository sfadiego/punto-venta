import { ISubscription } from "@/models/ISubscription";

// Espejo de SubscriptionModel::TRIAL_NOTES: una prueba es un registro sin monto cuya nota empieza con esta frase.
const TRIAL_NOTES = "Periodo de prueba";

export const isTrialSubscription = (subscription: Pick<ISubscription, "amount" | "notes">): boolean =>
    !subscription.amount && !!subscription.notes?.startsWith(TRIAL_NOTES);
