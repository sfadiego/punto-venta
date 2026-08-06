import { ChevronLeft, Loader, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useEmployeeDetailPage } from "./useEmployeeDetailPage";
import { EmployeeFormFields } from "./partials/EmployeeModals/EmployeeFormFields";
import { AbsencesSection } from "./partials/Absences/AbsencesSection";

export default function EmployeeDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const employeeId = Number(id);

    const { employee, isLoading, formik } = useEmployeeDetailPage(employeeId);

    if (isLoading || !employee) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader size={20} className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="px-5 py-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(AdminRoutes.EmployeeList)}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-stone-900 truncate">{employee.name}</h1>
                    {employee.phone && <p className="text-stone-500 text-sm mt-0.5">{employee.phone}</p>}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <UserRound size={16} className="text-amber-600" />
                    </div>
                    <h2 className="font-semibold text-stone-900 text-sm">Información del empleado</h2>
                </div>

                <form onSubmit={formik.handleSubmit}>
                    <EmployeeFormFields formik={formik} />

                    <div className="pt-5">
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar cambios"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-5">
                <AbsencesSection employee={employee} />
            </div>
        </div>
    );
}
