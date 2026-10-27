<?php

namespace App\Enums;

/** Códigos de error de la API que el frontend interpreta; refleja resources/js/enums/ApiErrorCodeEnum.ts. */
enum ApiErrorCodeEnum: string
{
    case TenantInactive = 'TENANT_INACTIVE';
    case SubscriptionExpired = 'SUBSCRIPTION_EXPIRED';
    case NoBranchAssigned = 'NO_BRANCH_ASSIGNED';
    case ConcurrentUsersLimit = 'CONCURRENT_USERS_LIMIT';
}
