import { Settings2, Upload, CreditCard, Loader } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useSettingsPage } from "./useSettingsPage";

export default function SettingsPage() {
    const { settings, isLoading, saving, toggleLogoUpload, paymentFormik } = useSettingsPage();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-2xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Settings2 size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Configuración global</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Opciones que aplican a todos los clientes</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Logo</h2>
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Upload size={16} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Subida de imagen de logo</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Permite que los clientes suban su propio logo desde su panel de configuración.
                                            Requiere almacenamiento persistente configurado.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={settings?.logo_upload_enabled}
                                    disabled={saving}
                                    onClick={toggleLogoUpload}
                                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50
                                        ${settings?.logo_upload_enabled ? "bg-indigo-600" : "bg-slate-200"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform
                                            ${settings?.logo_upload_enabled ? "translate-x-5" : "translate-x-0"}`}
                                    />
                                </button>
                            </div>
                        </section>

                        <form onSubmit={paymentFormik.handleSubmit}>
                            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                                <div className="flex items-center gap-2.5">
                                    <CreditCard size={16} className="text-indigo-500" />
                                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Datos de pago</h2>
                                </div>
                                <p className="text-xs text-slate-400 -mt-3">
                                    Esta información se mostrará a los clientes en su página de suscripción.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field
                                        label="Banco"
                                        name="bank"
                                        value={paymentFormik.values.bank}
                                        onChange={paymentFormik.handleChange}
                                        onBlur={paymentFormik.handleBlur}
                                        error={paymentFormik.touched.bank ? paymentFormik.errors.bank : undefined}
                                        placeholder="Ej. Mercado Pago"
                                    />
                                    <Field
                                        label="Número de cuenta"
                                        name="account"
                                        value={paymentFormik.values.account}
                                        onChange={paymentFormik.handleChange}
                                        onBlur={paymentFormik.handleBlur}
                                        error={paymentFormik.touched.account ? paymentFormik.errors.account : undefined}
                                        placeholder="Ej. 1234567890"
                                    />
                                    <Field
                                        label="Titular"
                                        name="holder"
                                        value={paymentFormik.values.holder}
                                        onChange={paymentFormik.handleChange}
                                        onBlur={paymentFormik.handleBlur}
                                        error={paymentFormik.touched.holder ? paymentFormik.errors.holder : undefined}
                                        placeholder="Nombre completo"
                                        className="sm:col-span-2"
                                    />
                                    <Field
                                        label="Concepto"
                                        name="concept"
                                        value={paymentFormik.values.concept}
                                        onChange={paymentFormik.handleChange}
                                        onBlur={paymentFormik.handleBlur}
                                        placeholder="Ej. Mensualidad Sistema POS"
                                        className="sm:col-span-2"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={paymentFormik.isSubmitting || !paymentFormik.dirty}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                                    >
                                        {paymentFormik.isSubmitting && <Loader size={14} className="animate-spin" />}
                                        Guardar datos de pago
                                    </button>
                                </div>
                            </section>
                        </form>
                    </>
                )}
            </div>
        </SuperAdminLayout>
    );
}

interface FieldProps {
    label: string;
    name: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    error?: string;
    placeholder?: string;
    className?: string;
}

const Field = ({ label, name, value, onChange, onBlur, error, placeholder, className }: FieldProps) => (
    <div className={className}>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
        <input
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);
