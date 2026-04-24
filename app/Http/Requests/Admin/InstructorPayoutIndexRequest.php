<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstructorPayoutIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['search', 'status', 'payout_method', 'sort_by', 'sort_dir'] as $key) {
            if ($this->has($key) && is_string($this->input($key))) {
                $this->merge([$key => trim((string) $this->input($key))]);
            }
        }

        if ($this->input('search') === '') {
            $this->merge(['search' => null]);
        }

        if ($this->input('status') === '') {
            $this->merge(['status' => null]);
        }

        if ($this->input('payout_method') === '') {
            $this->merge(['payout_method' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'processing', 'paid', 'failed'])],
            'payout_method' => ['nullable', 'string', Rule::in(['bank_transfer', 'paypal', 'stripe_connect', 'yape', 'plim'])],
            'sort_by' => ['nullable', 'string', Rule::in([
                'name',
                'status',
                'gross_sales',
                'platform_fee',
                'net_amount',
                'period_start',
                'period_end',
                'paid_at',
                'created_at',
            ])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
