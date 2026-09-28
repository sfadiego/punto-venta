import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AxiosProvider } from "./contexts/AxiosContext";
import { FeatureSpotlightQueueProvider } from "./contexts/FeatureSpotlightQueueContext";
import { ChunkErrorBoundary } from "./components/ErrorBoundary/ChunkErrorBoundary";
import { router } from "./router/routes";
import { MantineProvider } from "@mantine/core";
import { useErrorReporting } from "./hooks/useErrorReporting";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 2 * 60 * 1000, // 2 min — evita refetch en cada navegación
            // Sin esto, el default de TanStack (3 reintentos con backoff) amplifica la carga
            // justo cuando el backend ya está batallando (timeouts/5xx bajo alta concurrencia)
            // — cada query que use useQuery/useInfiniteQuery directo (fuera de hooks/useApi.ts,
            // que ya ponía retry:false explícito) heredaba esto sin darse cuenta. Una query que
            // sí necesite reintentar puede pasar su propio `retry` y sobreescribe este default.
            retry: false,
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
                    <FeatureSpotlightQueueProvider>
                        <Suspense>
                            <ToastContainer {...toastConfig} />
                            <ChunkErrorBoundary>
                                <RouterProvider router={router} future={{ v7_startTransition: true }} />
                            </ChunkErrorBoundary>
                        </Suspense>
                    </FeatureSpotlightQueueProvider>
                </QueryClientProvider>
            </MantineProvider>
        </AxiosProvider>
    );
};
