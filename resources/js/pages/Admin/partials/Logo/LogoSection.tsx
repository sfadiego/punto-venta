import { Upload, Trash2, ImageOff } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { IconPickerField } from "@/components/ui/IconPickerField";
import { useLogoSection } from "./useLogoSection";
import { useIconSelector } from "./useIconSelector";

interface LogoSectionProps {
    config: IBusinessConfig | undefined;
}

function LogoPreview({ config, logoUrl }: { config: IBusinessConfig | undefined; logoUrl: string | null }) {
    if (logoUrl) {
        return <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />;
    }

    if (config?.logo_icon) {
        return <CatalogIcon iconName={config.logo_icon} iconSource={config.logo_icon_source} size={40} className="text-amber-500" />;
    }

    return <ImageOff size={32} className="text-stone-300" />;
}

export function LogoSection({ config }: LogoSectionProps) {
    const { inputRef, logoUrl, uploading, removing, handleFileChange, handleRemove } =
        useLogoSection(config);
    const { handleSelect, saving } = useIconSelector(config);

    const uploadEnabled = config?.logo_upload_enabled === true;

    return (
        <section className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-4">Logo del negocio</h2>

            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50 overflow-hidden shrink-0">
                    <LogoPreview config={config} logoUrl={logoUrl} />
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                    {uploadEnabled ? (
                        <>
                            <p className="text-sm text-stone-500">PNG, JPG o WebP. Máximo 2 MB.</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Upload size={15} />
                                    {uploading ? "Subiendo…" : logoUrl ? "Cambiar logo" : "Subir logo"}
                                </button>

                                {logoUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        disabled={removing}
                                        className="flex items-center gap-2 px-4 py-2 border border-red-200 hover:bg-red-50 disabled:opacity-60 text-red-600 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <Trash2 size={15} />
                                        {removing ? "Eliminando…" : "Quitar logo"}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-stone-400 italic">
                            La subida de imágenes no está disponible. Selecciona un icono predefinido.
                        </p>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="mt-5">
                <IconPickerField
                    label="Ícono predefinido"
                    iconName={config?.logo_icon ?? ""}
                    iconSource={config?.logo_icon_source ?? ""}
                    onChange={handleSelect}
                />
                {saving && <p className="text-xs text-stone-400 mt-1.5">Guardando…</p>}
            </div>
        </section>
    );
}
