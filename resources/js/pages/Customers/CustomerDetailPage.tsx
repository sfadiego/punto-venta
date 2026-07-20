import { ChevronLeft, Loader } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useCustomerDetailPage } from "./useCustomerDetailPage";
import { CustomerBalanceCard } from "./partials/CustomerBalanceCard";
import { CustomerPaymentForm } from "./partials/CustomerPaymentForm";
import { CustomerCreditOrdersList } from "./partials/CustomerCreditOrdersList";
import { CustomerPaymentHistoryList } from "./partials/CustomerPaymentHistoryList";

export default function CustomerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const customerId = Number(id);

    const {
        customer,
        isLoading,
        paymentFormik,
        handleLiquidarTodo,
        isPaying,
        handleToggleCredit,
        isTogglingCredit,
    } = useCustomerDetailPage(customerId);

    if (isLoading || !customer) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader size={20} className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(AdminRoutes.CustomerList)}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-stone-900 truncate">{customer.name}</h1>
                    {customer.phone && <p className="text-stone-500 text-sm mt-0.5">{customer.phone}</p>}
                </div>
            </div>

            <CustomerBalanceCard
                customer={customer}
                onToggleCredit={handleToggleCredit}
                isTogglingCredit={isTogglingCredit}
            />

            <CustomerPaymentForm
                balance={Number(customer.balance)}
                formik={paymentFormik}
                onLiquidarTodo={handleLiquidarTodo}
                isPaying={isPaying}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomerCreditOrdersList orders={customer.credit_orders} />
                <CustomerPaymentHistoryList payments={customer.payments} />
            </div>
        </div>
    );
}
