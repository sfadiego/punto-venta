import { useState } from "react";

export const useCustomerInfoSection = () => {
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);
    const toggle = () => setShowCustomerInfo((prev) => !prev);

    return { showCustomerInfo, toggle };
};
