import { Loader, Weight } from "lucide-react";

interface ScaleReadButtonProps {
    isReading: boolean;
    onRead: () => Promise<void>;
}

export const ScaleReadButton = ({ isReading, onRead }: ScaleReadButtonProps) => (
    <button
        type="button"
        onClick={onRead}
        disabled={isReading}
        title="Leer báscula"
        className="flex items-center justify-center w-8 h-8 sm:w-6 sm:h-6 rounded-md
            text-amber-500 bg-amber-50 hover:bg-amber-100
            transition-colors shrink-0 disabled:cursor-wait disabled:opacity-60"
    >
        {isReading ? (
            <Loader size={15} className="animate-spin sm:hidden" />
        ) : (
            <Weight size={15} className="sm:hidden" />
        )}
        {isReading ? (
            <Loader size={12} className="animate-spin hidden sm:block" />
        ) : (
            <Weight size={12} className="hidden sm:block" />
        )}
    </button>
);
