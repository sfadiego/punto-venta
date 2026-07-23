import { CheckCircle } from "lucide-react";

export const DemoRequestSuccess = () => (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle size={40} className="text-emerald-500" />
        <p className="text-stone-700 font-medium">¡Solicitud recibida!</p>
        <p className="text-stone-400 text-sm">
            Nos pondremos en contacto contigo pronto para coordinar tu demo.
        </p>
    </div>
);
