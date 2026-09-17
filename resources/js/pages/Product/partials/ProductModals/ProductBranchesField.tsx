import { FormikProps } from "formik";
import { Loader } from "lucide-react";
import { useBranchList } from "@/services/useBranchService";
import { ProductForm } from "./useProductModal";

interface ProductBranchesFieldProps {
    formik: FormikProps<ProductForm>;
}

/**
 * Checklist multi-sucursal — un producto puede estar disponible en varias sucursales a
 * la vez (relación muchos-a-muchos, ver product_branch en CLAUDE.md), por eso no usa el
 * wrapper <SelectBranch> (single-value). "Todas las sucursales" representa branch_ids
 * vacío: elegir una sucursal específica la desmarca automáticamente, y viceversa.
 */
export const ProductBranchesField = ({ formik }: ProductBranchesFieldProps) => {
    const { data: branches, isLoading } = useBranchList();
    const selected = formik.values.branch_ids;

    const toggleBranch = (id: string) => {
        const next = selected.includes(id) ? selected.filter((b) => b !== id) : [...selected, id];
        formik.setFieldValue("branch_ids", next);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Sucursales</label>
            <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-44 overflow-y-auto">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer px-3 py-2.5">
                    <input
                        type="checkbox"
                        checked={selected.length === 0}
                        onChange={() => formik.setFieldValue("branch_ids", [])}
                        className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-medium text-stone-800">Todas las sucursales</span>
                </label>

                {isLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-stone-400">
                        <Loader size={14} className="animate-spin" />
                        Cargando sucursales...
                    </div>
                ) : (
                    (branches ?? []).map((branch) => (
                        <label
                            key={branch.id}
                            className="flex items-center gap-2.5 text-sm text-stone-600 cursor-pointer px-3 py-2.5"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(String(branch.id))}
                                onChange={() => toggleBranch(String(branch.id))}
                                className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span>{branch.name}</span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};
