interface DeliveryOptionProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    primaryColor: string;
    onClick: () => void;
}

export const DeliveryOption = ({ icon, label, active, primaryColor, onClick }: DeliveryOptionProps) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border text-sm font-medium transition-all active:scale-[0.97] w-full"
        style={
            active
                ? { borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}12` }
                : { borderColor: "#e7e5e4", color: "#78716c", backgroundColor: "#fafaf9" }
        }
    >
        {icon}
        <span className="text-center leading-tight text-xs">{label}</span>
    </button>
);
