import { createContext, useContext, ReactNode } from "react";
import { useQuickSalePage } from "./useQuickSalePage";

type QuickSaleContextValue = ReturnType<typeof useQuickSalePage>;

const QuickSaleContext = createContext<QuickSaleContextValue | null>(null);

export const QuickSaleProvider = ({ children }: { children: ReactNode }) => {
    const value = useQuickSalePage();
    return <QuickSaleContext.Provider value={value}>{children}</QuickSaleContext.Provider>;
};

export const useQuickSaleContext = () => {
    const context = useContext(QuickSaleContext);
    if (!context) {
        throw new Error("useQuickSaleContext debe usarse dentro de QuickSaleProvider");
    }
    return context;
};
