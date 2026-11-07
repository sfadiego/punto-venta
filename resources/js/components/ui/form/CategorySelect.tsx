import { useRef, useState, useEffect } from "react";
import { ChevronDown, Loader, Plus, Search } from "lucide-react";
import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";

interface CategorySelectProps<T> {
    name: Extract<keyof T, string>;
    formik: FormikProps<T>;
    categories: ICategory[];
    label?: string;
    placeholder?: string;
    /** Si se pasa, al buscar un nombre que no existe se ofrece crearlo. Devuelve el id creado o null si falló. */
    onCreate?: (nombre: string) => Promise<number | null>;
}

export const CategorySelect = <T,>({ name, formik, categories, label = "", placeholder = "Seleccionar...", onCreate }: CategorySelectProps<T>) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const touched = Boolean(formik.touched[name as keyof T]);
    const hasError = Boolean(formik.errors[name as keyof T]);
    const showError = (touched || formik.submitCount > 0) && hasError;

    const selectedId = formik.values[name as keyof T] as unknown as string;
    const selected = categories.find((cat) => String(cat.id) === selectedId);

    const trimmedSearch = search.trim();
    const filtered = trimmedSearch
        ? categories.filter((cat) => cat.nombre.toLowerCase().includes(trimmedSearch.toLowerCase()))
        : categories;
    const canCreate =
        Boolean(onCreate) &&
        trimmedSearch !== "" &&
        !categories.some((cat) => cat.nombre.trim().toLowerCase() === trimmedSearch.toLowerCase());

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleToggle = () => {
        // shouldValidate=false: no hay valor nuevo que validar aquí, solo marca touched para
        // que el error (si ya existía) se muestre al cerrar sin elegir nada.
        if (!open) formik.setFieldTouched(name, true, false);
        setOpen((prev) => !prev);
        setSearch("");
    };

    const selectValue = (value: string) => {
        // setFieldValue ya dispara su propia validación con el valor nuevo — si
        // setFieldTouched también valida (su default), ambas validaciones corren async y la
        // de setFieldTouched puede resolver con el valor viejo (vacío) y pisar el resultado
        // correcto, dejando el error de "requerido" pegado aunque ya haya selección.
        formik.setFieldValue(name, value);
        formik.setFieldTouched(name, true, false);
        setOpen(false);
        setSearch("");
    };

    const handleSelect = (cat: ICategory) => selectValue(String(cat.id));

    const handleCreate = async () => {
        if (!onCreate || isCreating) return;
        setIsCreating(true);
        try {
            const createdId = await onCreate(trimmedSearch);
            if (createdId !== null) selectValue(String(createdId));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={handleToggle}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 border rounded-xl text-sm text-left
                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow
                        ${showError ? "border-red-400 bg-red-50" : "border-stone-300"}`}
                >
                    <span className={selected ? "text-stone-900 truncate" : "text-stone-400 truncate"}>
                        {selected ? selected.nombre : placeholder}
                    </span>
                    <ChevronDown size={14} className="text-stone-400 shrink-0" />
                </button>

                {open && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="relative p-2 border-b border-stone-100">
                            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar categoría..."
                                className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>

                        <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5">
                            {filtered.length === 0 && (
                                <p className="text-xs text-stone-400 text-center py-3">Sin categorías que coincidan</p>
                            )}
                            {filtered.map((cat) => {
                                const isSelected = String(cat.id) === selectedId;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleSelect(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                                            isSelected ? "bg-amber-500 text-white" : "hover:bg-stone-50 text-stone-700"
                                        }`}
                                    >
                                        {cat.nombre}
                                    </button>
                                );
                            })}
                        </div>

                        {canCreate && (
                            <div className="border-t border-stone-100 p-1.5">
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-600 hover:bg-amber-50 disabled:opacity-60 transition-colors"
                                >
                                    {isCreating ? <Loader size={14} className="animate-spin shrink-0" /> : <Plus size={14} className="shrink-0" />}
                                    <span className="truncate">Crear categoría «{trimmedSearch}»</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showError && (
                <p className="text-red-500 text-xs mt-1">{String(formik.errors[name])}</p>
            )}
        </div>
    );
};
