// Qué hará (o hizo) la importación masiva de productos con una fila del CSV. Espejo de
// App\Enums\ProductImportRowActionEnum (backend).
export enum ProductImportRowActionEnum {
    Create = "create",
    Update = "update",
    // La fila tiene un error que bloquea la importación del archivo hasta corregirla.
    Error = "error",
    // La fila no se importa, pero no bloquea el resto del archivo (ej. código con caracteres no permitidos).
    Skip = "skip",
}
