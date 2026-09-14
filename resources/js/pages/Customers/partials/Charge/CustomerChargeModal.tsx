import { FormikProps } from "formik";
import { X } from "lucide-react";
import { ICustomerCharge } from "@/models/ICustomer";
import { ChargeForm } from "../../useCustomerDetailPage";
import { CustomerChargeForm } from "./CustomerChargeForm";
import { CustomerChargeHistoryList } from "./CustomerChargeHistoryList";

interface CustomerChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    formik: FormikProps<ChargeForm>;
    isCharging: boolean;
    charges?: ICustomerCharge[];
}

export const CustomerChargeModal = ({ isOpen, onClose, formik, isCharging, charges }: CustomerChargeModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">Agregar Adeudo</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
                    <CustomerChargeForm formik={formik} isCharging={isCharging} />
                    <CustomerChargeHistoryList charges={charges} />
                </div>
            </div>
        </div>
    );
};
