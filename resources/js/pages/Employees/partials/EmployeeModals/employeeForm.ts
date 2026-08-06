import * as Yup from "yup";
import { SalaryPeriod, WorkDay } from "@/models/IEmployee";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";
import { isPerDaySalaryPeriod } from "@/utils/salaryPeriodUtils";

export type EmployeeForm = {
    name: string;
    phone: string;
    salary: string;
    salary_period: SalaryPeriod;
    work_days: WorkDay[];
};

export const EMPLOYEE_FORM_INITIAL_VALUES: EmployeeForm = {
    name: "",
    phone: "",
    salary: "",
    salary_period: "monthly",
    work_days: [],
};

export const employeeSchema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    phone: Yup.string()
        .max(13, "Máximo 13 caracteres")
        .test("phone-valid", phoneValidationMessage, (v) => !v || isValidPhone(v)),
    salary: Yup.number()
        .typeError("El salario debe ser un número")
        .required("El salario es requerido")
        .min(0, "El salario no puede ser negativo"),
    salary_period: Yup.mixed<SalaryPeriod>()
        .oneOf(["daily", "weekly", "weekend", "biweekly", "monthly"])
        .required("La periodicidad es requerida"),
    work_days: Yup.array()
        .of(Yup.mixed<WorkDay>().required())
        .when("salary_period", {
            is: (period: SalaryPeriod) => isPerDaySalaryPeriod(period),
            then: (schema) => schema.min(1, "Selecciona al menos un día").required("Selecciona al menos un día"),
            otherwise: (schema) => schema.notRequired(),
        }),
});
