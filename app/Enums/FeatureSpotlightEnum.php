<?php

namespace App\Enums;

// Debe reflejar los keys de resources/js/enums/FeatureSpotlightEnum.ts
enum FeatureSpotlightEnum: string
{
    case ROLE_PERMISSIONS = 'role_permissions';
    case EXPENSES_BUTTON = 'expenses_button';
    case CUSTOMER_SECTION = 'customer_section';
    case USERS_SECTION = 'users_section';
    case PRODUCT_SECTION = 'product_section';
    case CATEGORIES_SECTION = 'categories_section';
    case CONFIGURATION_SECTION = 'configuration_section';
    case DELIVERY_SECTION = 'delivery_section';
    case SUBSCRIPTION_SECTION = 'subscription_section';
    case ONLINE_MENU_SECTION = 'online_menu_section';
    case ORDER_LIST_SECTION = 'order_list_section';
    case TICKET_SECTION = 'ticket_section';
    case FILTER_SALES_BY_DATE_MONTH = 'filter_sales_by_date_month';
}
