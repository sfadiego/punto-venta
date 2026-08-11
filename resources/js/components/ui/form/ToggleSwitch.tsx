interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    activeColor?: string;
    disabled?: boolean;
}

export const ToggleSwitch = ({ checked, onChange, activeColor = "bg-emerald-500", disabled = false }: ToggleSwitchProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? activeColor : "bg-stone-300"} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                checked ? "translate-x-5" : "translate-x-0"
            }`}
        />
    </button>
);
