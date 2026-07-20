import { ICustomer } from "@/models/ICustomer";
import { useCustomerCreditPicker } from "./useCustomerCreditPicker";
import { CustomerSearchPanel } from "./CustomerSearchPanel";
import { NewCustomerInlineForm } from "./NewCustomerInlineForm";

interface CustomerCreditPickerProps {
    customers: ICustomer[];
    selectedCustomerId: number | null;
    onSelect: (id: number) => void;
}

export const CustomerCreditPicker = ({ customers, selectedCustomerId, onSelect }: CustomerCreditPickerProps) => {
    const {
        search, setSearch,
        filtered,
        showNewForm, openNewForm, closeNewForm,
        newName, setNewName,
        newPhone, setNewPhone,
        isCreating,
        handleCreate,
    } = useCustomerCreditPicker({ customers, onSelect });

    return (
        <div className="space-y-2">
            <p className="text-xs text-stone-500 text-left">Cliente</p>

            {showNewForm ? (
                <NewCustomerInlineForm
                    newName={newName}
                    setNewName={setNewName}
                    newPhone={newPhone}
                    setNewPhone={setNewPhone}
                    isCreating={isCreating}
                    onCancel={closeNewForm}
                    onCreate={handleCreate}
                />
            ) : (
                <CustomerSearchPanel
                    customers={filtered}
                    search={search}
                    setSearch={setSearch}
                    selectedCustomerId={selectedCustomerId}
                    onSelect={onSelect}
                    onOpenNewForm={openNewForm}
                />
            )}
        </div>
    );
};
