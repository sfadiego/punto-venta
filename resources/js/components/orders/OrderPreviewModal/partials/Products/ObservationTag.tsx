interface ObservationTagProps {
    text: string;
}

/** Observación de una línea, con el mismo estilo de chip que los toppings. */
export const ObservationTag = ({ text }: ObservationTagProps) => (
    <span className="inline-block mt-1 text-[11px] leading-snug text-amber-800 bg-amber-100 rounded-[3px] px-1.5 py-px">{text}</span>
);
