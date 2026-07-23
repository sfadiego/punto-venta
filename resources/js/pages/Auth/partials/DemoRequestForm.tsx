import { Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Select, SelectOption } from "@/components/ui/form/Select";
import { BUSINESS_NICHE_LABELS } from "@/enums/BusinessNicheEnum";
import { DemoRequestForm as DemoRequestFormValues } from "../useAuthPage";

const NICHE_OPTIONS: SelectOption[] = Object.entries(BUSINESS_NICHE_LABELS).map(
    ([value, label]) => ({ value, label }),
);

interface DemoRequestFormProps {
    formik: FormikProps<DemoRequestFormValues>;
    isSubmitting: boolean;
}

export const DemoRequestForm = ({ formik, isSubmitting }: DemoRequestFormProps) => (
    <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Solicitar demo gratuita</h3>
        <p className="text-stone-400 text-xs mb-4">Te contactamos en menos de 24 horas</p>

        <form onSubmit={formik.handleSubmit} className="space-y-3">
            <Input
                name="business_name"
                placeholder="Nombre del negocio"
                formik={formik}
            />
            <Input
                name="email"
                inputType="email"
                placeholder="Correo electrónico"
                formik={formik}
            />
            <Input
                name="phone"
                inputType="tel"
                placeholder="Teléfono"
                formik={formik}
                maxLength={12}
            />
            <Select
                name="business_niche"
                options={NICHE_OPTIONS}
                placeholder="Giro de tu negocio"
                formik={formik}
            />
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50
                    text-white rounded-xl text-sm font-medium transition-colors
                    flex items-center justify-center gap-2"
            >
                {isSubmitting && <Loader size={15} className="animate-spin" />}
                Solicitar demo
            </button>
        </form>
    </div>
);
