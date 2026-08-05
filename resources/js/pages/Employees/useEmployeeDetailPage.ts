import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useShowEmployee, useUpdateEmployee } from "@/services/useEmployeesService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { EmployeeForm, EMPLOYEE_FORM_INITIAL_VALUES, employeeSchema } from "./partials/EmployeeModals/employeeForm";

export const useEmployeeDetailPage = (employeeId: number) => {
    const queryClient = useQueryClient();
    const { data: employee, isLoading } = useShowEmployee(employeeId);
    const { mutateAsync: updateEmployee } = useUpdateEmployee(employeeId);

    const formik = useFormik<EmployeeForm>({
        enableReinitialize: true,
        initialValues: employee
            ? {
                  name: employee.name,
                  phone: employee.phone ?? "",
                  salary: String(employee.salary),
                  salary_period: employee.salary_period,
                  work_days: employee.work_days,
              }
            : EMPLOYEE_FORM_INITIAL_VALUES,
        validationSchema: employeeSchema,
        onSubmit: async (values) => {
            try {
                await updateEmployee({
                    name: values.name.trim(),
                    phone: values.phone.trim() || null,
                    salary: Number(values.salary),
                    salary_period: values.salary_period,
                    work_days: values.work_days,
                });
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Employee}/${employeeId}`] });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Employee] });
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Employee}/list`] });
                toast.success("Empleado actualizado");
            } catch (error) {
                logUnexpectedError(error, "useEmployeeDetailPage.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al actualizar el empleado"));
            }
        },
    });

    return { employee, isLoading, formik };
};
