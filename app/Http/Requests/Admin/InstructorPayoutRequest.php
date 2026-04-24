<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstructorPayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['payment_reference', 'paid_at'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->has('currency')) {
            $this->merge(['currency' => strtoupper(trim((string) $this->input('currency')))]);
        }
    }

    public function rules(): array
    {
        return [
            'instructor_id' => ['required', 'uuid', Rule::exists('instructors', 'id')],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'currency' => ['required', 'string', Rule::in(['USD', 'PEN'])],
            'commission_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'string', Rule::in(['pending', 'processing', 'paid', 'failed'])],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['nullable', 'date', 'required_if:status,paid'],
        ];
    }

    public function messages(): array
    {
        return [
            'instructor_id.required' => 'Selecciona un instructor.',
            'instructor_id.exists' => 'El instructor seleccionado no existe.',
            'period_end.after_or_equal' => 'El fin del período debe ser mayor o igual al inicio.',
            'currency.in' => 'La moneda debe ser USD o PEN.',
            'commission_pct.max' => 'La comisión no puede superar el 100%.',
            'status.in' => 'El estado seleccionado no es válido.',
            'paid_at.required_if' => 'La fecha de pago es obligatoria cuando el estado es pagado.',
        ];
    }
}
