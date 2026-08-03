<?php

namespace App\Enums;

enum TenantStatusEnum: string
{
    case All = 'all';
    case Active = 'active';
    case Inactive = 'inactive';
    case Deleted = 'deleted';
}
