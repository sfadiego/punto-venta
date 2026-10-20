<?php

namespace App\Enums;

/**
 * Qué hará (o hizo) la importación masiva de productos con una fila del CSV. Se refleja 1:1 en
 * resources/js/enums/ProductImportRowActionEnum.ts.
 */
enum ProductImportRowActionEnum: string
{
    case Create = 'create';
    case Update = 'update';
    // La fila tiene un error que bloquea la importación del archivo hasta corregirla.
    case Error = 'error';
    // La fila no se importa, pero no bloquea el resto del archivo (ej. código con caracteres no permitidos).
    case Skip = 'skip';
}
