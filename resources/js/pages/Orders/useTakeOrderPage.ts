import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useTakeOrderPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

    const handleBack = () => {
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        navigate(-1);
    };

    return { mobileTab, setMobileTab, handleBack };
};
