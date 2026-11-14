import { useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { IEmployee } from "@/models/IEmployee";
import { useStoreEmployee, useUpdateEmployee } from "@/services/useEmployeesService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { EmployeeForm, employeeFormToPayload, employeeSchema, getEmployeeFormValues } from "./employeeForm";

export const useEmployeeModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);
    const isEditing = editingEmployee !== null;

    const { mutateAsync: storeEmployee } = useStoreEmployee();
    const { mutateAsync: updateEmployee } = useUpdateEmployee(editingEmployee?.id ?? 0);

    const formik = useFormik<EmployeeForm>({
        enableReinitialize: true,
        initialValues: getEmployeeFormValues(editingEmployee),
        validationSchema: employeeSchema,
        onSubmit: async (values, helpers) => {
            try {
                const payload = employeeFormToPayload(values);

                if (isEditing) {
                    await updateEmployee(payload);
                    toast.success("Empleado actualizado");
                } else {
                    await storeEmployee(payload);
                    toast.success("Empleado creado exitosamente");
                }

                helpers.resetForm();
                setEditingEmployee(null);
                closeModal();
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useEmployeeModal.onSubmit");
                toast.error(
                    getUserFacingErrorMessage(
                        error,
                        isEditing ? "Error al actualizar el empleado" : "Error al crear el empleado",
                    ),
                );
            }
        },
    });

    const openCreateModal = () => {
        setEditingEmployee(null);
        openModal();
    };

    const openEditModal = (employee: IEmployee) => {
        setEditingEmployee(employee);
        openModal();
    };

    const handleClose = () => {
        formik.resetForm();
        setEditingEmployee(null);
        closeModal();
    };

    return { isOpen, isEditing, editingEmployee, openCreateModal, openEditModal, handleClose, formik };
};
