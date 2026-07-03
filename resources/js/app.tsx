import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AxiosProvider } from "./contexts/AxiosContext";
import { router } from "./router/routes";
import { MantineProvider } from "@mantine/core";
import { useErrorReporting } from "./hooks/useErrorReporting";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 2 * 60 * 1000, // 2 min — evita refetch en cada navegación
        },
    },
});

const toastConfig = {
    hideProgressBar: false,
    autoClose: 3500,
    position: "bottom-right" as const,
    draggable: false,
    closeOnClick: true,
};

const ErrorReportingInit = () => {
    useErrorReporting();
    return null;
};

export const App = () => {
    return (
        <AxiosProvider>
            <MantineProvider>
                <QueryClientProvider client={queryClient}>
                    <ErrorReportingInit />
                    <Suspense>
                        <ToastContainer {...toastConfig} />
                        <RouterProvider router={router} future={{ v7_startTransition: true }} />
                    </Suspense>
                </QueryClientProvider>
            </MantineProvider>
        </AxiosProvider>
    );
};
