import { QuickSaleProvider } from "./QuickSaleContext";
import { QuickSaleContent } from "./partials/QuickSaleLayout/QuickSaleContent";

export default function QuickSalePage() {
    return (
        <QuickSaleProvider>
            <QuickSaleContent />
        </QuickSaleProvider>
    );
}
