import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { useBranchList } from "@/services/useBranchService";

interface SelectBranchProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Selector de sucursal — opciones resueltas de las sucursales autorizadas del usuario
 * autenticado (useBranchList). Soporta modo formik (apertura de caja, formulario de
 * producto) o modo controlado value/onChange (filtros de listado), igual que el Select
 * base — nunca declarar un <Select options={...}> inline con sucursales en el archivo
 * que lo usa.
 */
export const SelectBranch = <T,>({
    name,
    formik,
    value,
    onChange,
    label = "Sucursal",
    placeholder = "Selecciona una sucursal",
    disabled,
    className,
}: SelectBranchProps<T>) => {
    const { data: branches, isLoading } = useBranchList();

    const options = (branches ?? []).map((branch) => ({
        value: String(branch.id),
        label: branch.name,
    }));

    return (
        <Select<T>
            name={name}
            options={options}
            formik={formik}
            value={value}
            onChange={onChange}
            label={label}
            placeholder={isLoading ? "Cargando sucursales..." : placeholder}
            disabled={disabled || isLoading}
            className={className}
        />
    );
};
