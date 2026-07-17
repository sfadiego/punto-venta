import { Phone, MapPin, Share2, Camera, Globe, MessageCircle, Receipt, Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useBusinessInfoSection } from "./useBusinessInfoSection";

interface BusinessInfoSectionProps {
    config: IBusinessConfig | undefined;
}

export const BusinessInfoSection = ({ config }: BusinessInfoSectionProps) => {
    const { formik } = useBusinessInfoSection(config);

    return (
        <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Información del negocio</h2>
                <p className="text-xs text-stone-400">Aparece en el pie del ticket impreso</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                    icon={<Phone size={15} />}
                    label="Teléfono"
                    name="phone"
                    placeholder="(312) 000-0000"
                    formik={formik}
                />
                <Field
                    icon={<MessageCircle size={15} />}
                    label="WhatsApp"
                    name="whatsapp"
                    placeholder="+52 312 000 0000"
                    formik={formik}
                />
                <Field
                    icon={<Share2 size={15} />}
                    label="Facebook"
                    name="facebook"
                    placeholder="@mi-negocio"
                    formik={formik}
                />
                <Field
                    icon={<Camera size={15} />}
                    label="Instagram"
                    name="instagram"
                    placeholder="@mi-negocio"
                    formik={formik}
                />
                <Field
                    icon={<Globe size={15} />}
                    label="Sitio web"
                    name="website"
                    placeholder="https://mi-negocio.com"
                    formik={formik}
                    className="sm:col-span-2"
                />
                <Field
                    icon={<MapPin size={15} />}
                    label="Dirección"
                    name="address"
                    placeholder="Calle, número, colonia"
                    formik={formik}
                    className="sm:col-span-2"
                />
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
                    <Receipt size={14} className="text-amber-500" />
                    Mensaje en pie de ticket
                </label>
                <input
                    type="text"
                    name="ticket_footer"
                    value={formik.values.ticket_footer}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Gracias por su visita!"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                {formik.touched.ticket_footer && formik.errors.ticket_footer && (
                    <p className="text-red-500 text-xs">{formik.errors.ticket_footer as string}</p>
                )}
                <p className="text-xs text-stone-400 text-right">{formik.values.ticket_footer.length}/100</p>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.dirty}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                    Guardar información
                </button>
            </div>
        </form>
    );
};

interface FieldProps {
    icon: React.ReactNode;
    label: string;
    name: string;
    placeholder?: string;
    formik: ReturnType<typeof useBusinessInfoSection>["formik"];
    className?: string;
}

const Field = ({ icon, label, name, placeholder, formik, className = "" }: FieldProps) => (
    <div className={className}>
        <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
            <span className="text-amber-500">{icon}</span>
            {label}
        </label>
        <input
            type="text"
            name={name}
            value={(formik.values as Record<string, string>)[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        {(formik.touched as Record<string, boolean>)[name] && (formik.errors as Record<string, string>)[name] && (
            <p className="text-red-500 text-xs mt-1">{(formik.errors as Record<string, string>)[name]}</p>
        )}
    </div>
);
