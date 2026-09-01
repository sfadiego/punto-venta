import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useScale, ScaleNotConnectedError, ScalePairingCancelledError } from "@/contexts/ScaleContext";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ScaleReadStatusEnum } from "@/enums/ScaleReadStatusEnum";

export type ScaleReadResult =
    | { status: ScaleReadStatusEnum.Ok; weightKg: number }
    | { status: ScaleReadStatusEnum.Zero } // báscula alcanzable pero en 0 — no hay nada que agregar todavía
    | { status: ScaleReadStatusEnum.Unreachable }; // no se pudo leer (desconectada, error) — el llamador decide el fallback

// Báscula real (ScaleContext / Web Serial) — lectura bajo demanda, sin polling: el hardware
// no soporta un stream continuo, y este es el único patrón probado contra la báscula física
// en el proyecto.
//
// Enlazar (handlePairScale) y leer para agregar al carrito (readScaleForCart) son acciones
// separadas: ScaleReadout solo enlaza, y tocar una card de producto por peso dispara la
// lectura en vivo — sin paso intermedio de "peso en espera".
export const useQuickSaleScale = () => {
    const { readWeightKg, pair: pairScale, forget: forgetScale, isSupported: scaleSupported, isPaired: scaleIsPaired } = useScale();
    const [isPairing, setIsPairing] = useState(false);
    const [isReadingScale, setIsReadingScale] = useState(false);
    const [lastReadWeightKg, setLastReadWeightKg] = useState<number | null>(null);
    const isReadingRef = useRef(false);

    const handlePairScale = async () => {
        if (!scaleSupported) {
            toast.error("Báscula no disponible en este navegador (usa Chrome o Edge de escritorio)");
            return;
        }
        setIsPairing(true);
        try {
            await pairScale();
        } catch (error) {
            // Cancelar el selector de puertos es una acción normal del usuario, no un error.
            if (error instanceof ScalePairingCancelledError) return;
            logUnexpectedError(error, "useQuickSaleScale.handlePairScale");
            toast.error(error instanceof Error ? error.message : "No se pudo enlazar la báscula");
        } finally {
            setIsPairing(false);
        }
    };

    // Lectura en vivo disparada al tocar una card de producto por peso (solo si la báscula ya
    // está enlazada — ver useQuickSalePage.handleCardTap). Nunca abre el selector nativo de
    // puertos por su cuenta — eso es una acción explícita del usuario (handlePairScale) — así
    // que si la báscula ya no responde, esto falla con "unreachable" en vez de interrumpir el
    // flujo con un diálogo del navegador.
    const readScaleForCart = async (): Promise<ScaleReadResult> => {
        if (isReadingRef.current) return { status: ScaleReadStatusEnum.Unreachable };
        isReadingRef.current = true;
        setIsReadingScale(true);
        try {
            const weightKg = await readWeightKg();
            if (weightKg <= 0) {
                toast.info("La báscula marca 0 — coloca el producto y vuelve a leer");
                return { status: ScaleReadStatusEnum.Zero };
            }
            // Refleja en ScaleReadout el peso que se acaba de agregar al carrito — confirmación
            // visual del tap, sin reintroducir el paso de "peso en espera" de antes.
            setLastReadWeightKg(weightKg);
            return { status: ScaleReadStatusEnum.Ok, weightKg };
        } catch (error) {
            if (error instanceof ScaleNotConnectedError) {
                // El flag local decía "emparejada" pero ya no hay puerto conocido (cable
                // retirado, báscula apagada) — se corrige el estado para que ScaleReadout deje
                // de mostrar "conectada" y vuelva a ofrecer enlazar de nuevo.
                await forgetScale();
                toast.warning("Báscula desconectada — se agregó el peso por defecto, ajústalo si hace falta");
            } else {
                logUnexpectedError(error, "useQuickSaleScale.readScaleForCart");
                toast.error(error instanceof Error ? error.message : "No se pudo leer la báscula");
            }
            return { status: ScaleReadStatusEnum.Unreachable };
        } finally {
            isReadingRef.current = false;
            setIsReadingScale(false);
        }
    };

    return {
        scaleSupported,
        scaleIsPaired,
        isPairing,
        isReadingScale,
        lastReadWeightKg,
        handlePairScale,
        readScaleForCart,
    };
};
