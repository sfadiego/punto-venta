import { useState } from "react";
import { PayrollFilterPeriod } from "@/models/IEmployee";
import { useEmployeePayrollSummary } from "@/services/useEmployeesService";

export const usePayrollSummaryCard = () => {
    const [period, setPeriod] = useState<PayrollFilterPeriod>("month");
    const { data, isLoading } = useEmployeePayrollSummary(period);

    return {
        period,
        setPeriod,
        total: data?.total ?? 0,
        employeesCount: data?.employees_count ?? 0,
        isLoading,
    };
};
