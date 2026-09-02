<?php

namespace App\Printer\Data;

use App\Models\BusinessConfigModel;
use App\Printer\Dto\TicketDataInterface;

class TestTicketData implements TicketDataInterface
{
    public function __construct(private readonly BusinessConfigModel $tenant) {}

    public function getType(): string
    {
        return 'test';
    }

    public function toArray(): array
    {
        return [
            'business_name' => $this->tenant->business_name ?? 'POS',
            'paper_width' => $this->tenant->paper_width,
        ];
    }
}
