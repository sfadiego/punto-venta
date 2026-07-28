import { useScaleSection } from "./useScaleSection";
import { ScaleUnsupportedNotice } from "./ScaleUnsupportedNotice";
import { ScaleStatusCard } from "./ScaleStatusCard";

export const ScaleSection = () => {
    const { isSupported, isConnected, isPaired, isPairing, handlePair, handleForget } = useScaleSection();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Báscula</h2>
                <p className="text-xs text-stone-400">
                    Conecta la báscula USB de esta computadora para leer el peso directo al cobrar.
                </p>
            </div>

            {!isSupported ? (
                <ScaleUnsupportedNotice />
            ) : (
                <ScaleStatusCard
                    isConnected={isConnected}
                    isPaired={isPaired}
                    isPairing={isPairing}
                    onPair={handlePair}
                    onForget={handleForget}
                />
            )}
        </div>
    );
};
