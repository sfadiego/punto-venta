import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export type CustomersFilters = ReturnType<typeof useCustomersFilters>;

// Filtros del listado de clientes: búsqueda y casillas (adeudo, apartados, apartados vencidos).
export const useCustomersFilters = () => {
    // Estadísticas enlaza a /customers?con_adeudo=1 para abrir la lista ya filtrada.
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [withDebt, setWithDebt] = useState(searchParams.get("con_adeudo") === "1");
    const [withLayaway, setWithLayaway] = useState(false);
    const [layawayOverdue, setLayawayOverdue] = useState(false);

    return { search, setSearch, withDebt, setWithDebt, withLayaway, setWithLayaway, layawayOverdue, setLayawayOverdue };
};
