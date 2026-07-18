import { useState, useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useColorsSection } from "./useColorsSection";

interface ColorsSectionProps {
    config: IBusinessConfig | undefined;
}

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    description: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
    const [hexDraft, setHexDraft] = useState(value);

    useEffect(() => {
        setHexDraft(value);
    }, [value]);

    const handleHexChange = (raw: string) => {
        const normalized = raw.startsWith("#") ? raw : `#${raw}`;
        setHexDraft(normalized);
        if (HEX_RE.test(normalized)) {
            onChange(normalized.toUpperCase());
        }
    };

    const handleHexBlur = () => {
        if (!HEX_RE.test(hexDraft)) {
            setHexDraft(value);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-stone-700">{label}</label>
            <p className="text-xs text-stone-400 -mt-1">{description}</p>
            <div className="flex items-center gap-3 flex-wrap">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value.toUpperCase());
                        setHexDraft(e.target.value.toUpperCase());
                    }}
                    className="w-12 h-12 rounded-lg border border-stone-200 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Abrir selector de color"
                />
                <input
                    type="text"
                    value={hexDraft}
                    onChange={(e) => handleHexChange(e.target.value)}
                    onBlur={handleHexBlur}
                    maxLength={7}
                    spellCheck={false}
                    placeholder="#000000"
                    className={`w-28 border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                        HEX_RE.test(hexDraft)
                            ? "border-stone-200 text-stone-800"
                            : "border-red-300 text-red-600"
                    }`}
                />
                <div
                    className="w-16 h-10 rounded-lg border border-stone-200 shrink-0"
                    style={{ backgroundColor: HEX_RE.test(hexDraft) ? hexDraft : value }}
                />
            </div>
        </div>
    );
}

export function ColorsSection({ config }: ColorsSectionProps) {
    const {
        businessName, setBusinessName,
        primaryColor, setPrimaryColor,
        sidebarColor, setSidebarColor,
        fontColor, setFontColor,
        labelColor, setLabelColor,
        saving,
        handleSubmit,
        handleReset,
    } = useColorsSection(config);

    return (
        <section className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-5">
                Identidad y colores
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">
                        Nombre del negocio
                    </label>
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        maxLength={100}
                        placeholder="Ej. Chantico Café"
                        className="w-full max-w-sm border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="h-px bg-stone-100" />

                <ColorPicker
                    label="Color primario"
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    description="Botones, elementos activos y acentos"
                />

                <ColorPicker
                    label="Color del sidebar"
                    value={sidebarColor}
                    onChange={setSidebarColor}
                    description="Fondo de la barra de navegación lateral"
                />

                <ColorPicker
                    label="Color de fuente (sidebar)"
                    value={fontColor}
                    onChange={setFontColor}
                    description="Texto dentro del sidebar: nombre del negocio, ítems de menú"
                />

                <ColorPicker
                    label="Color de etiquetas (contenido)"
                    value={labelColor}
                    onChange={setLabelColor}
                    description="Texto principal en el área de contenido: títulos, etiquetas, datos"
                />

                {/* Preview */}
                <div className="rounded-xl overflow-hidden border border-stone-200 flex h-24">
                    {/* Sidebar mini */}
                    <div
                        className="w-20 flex flex-col justify-center gap-1 px-2"
                        style={{ backgroundColor: sidebarColor }}
                    >
                        <div
                            className="text-xs font-bold truncate"
                            style={{ color: fontColor }}
                        >
                            {businessName || "Negocio"}
                        </div>
                        <div
                            className="h-5 rounded px-1 flex items-center text-xs"
                            style={{ backgroundColor: primaryColor, color: fontColor }}
                        >
                            Menú
                        </div>
                        <div
                            className="text-xs"
                            style={{ color: `color-mix(in srgb, ${fontColor} 55%, transparent)` }}
                        >
                            Item
                        </div>
                    </div>
                    {/* Contenido mini */}
                    <div className="flex-1 bg-stone-50 flex flex-col justify-center px-4 gap-1">
                        <div
                            className="text-sm font-semibold"
                            style={{ color: labelColor }}
                        >
                            Título de página
                        </div>
                        <div
                            className="text-xs"
                            style={{ color: `color-mix(in srgb, ${labelColor} 60%, transparent)` }}
                        >
                            Etiqueta / descripción
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Save size={15} />
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 disabled:opacity-60 text-stone-500 text-sm font-medium rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Restablecer
                    </button>
                </div>
            </form>
        </section>
    );
}
