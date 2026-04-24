<?php

namespace App\Http\Requests\Admin;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }

        foreach (['description', 'applicable_id', 'valid_from', 'valid_until'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->has('max_uses') && $this->input('max_uses') === '') {
            $this->merge(['max_uses' => null]);
        }
    }

    public function rules(): array
    {
        /** @var Coupon|null $coupon */
        $coupon = $this->route('coupon');
        $couponId = $coupon?->getKey();

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed_amount'])],
            'discount_value' => ['required', 'numeric', 'gt:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_user' => ['required', 'integer', 'min:1', 'max:32767'],
            'min_purchase_amount' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::in(['all', 'course', 'category', 'package', 'specialization'])],
            'applicable_id' => ['nullable', 'uuid'],
            'is_active' => ['sometimes', 'boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
        ];

        if ($this->input('applies_to') !== 'all') {
            $rules['applicable_id'][] = 'required';
        }

        if ($this->input('applies_to') === 'course') {
            $rules['applicable_id'][] = Rule::exists('courses', 'id');
        }
        if ($this->input('applies_to') === 'category') {
            $rules['applicable_id'][] = Rule::exists('categories', 'id');
        }
        if ($this->input('applies_to') === 'package') {
            $rules['applicable_id'][] = Rule::exists('packages', 'id');
        }
        if ($this->input('applies_to') === 'specialization') {
            $rules['applicable_id'][] = Rule::exists('specializations', 'id');
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'code.required' => 'El código del cupón es obligatorio.',
            'code.unique' => 'Ese código ya está registrado.',
            'discount_type.in' => 'El tipo de descuento no es válido.',
            'discount_value.gt' => 'El valor del descuento debe ser mayor a 0.',
            'max_uses.min' => 'El máximo de usos debe ser al menos 1.',
            'max_uses_per_user.min' => 'Los usos por usuario deben ser al menos 1.',
            'applies_to.in' => 'El alcance del cupón no es válido.',
            'applicable_id.required' => 'Selecciona el recurso al que aplicará el cupón.',
            'applicable_id.uuid' => 'El identificador aplicable no tiene formato válido.',
            'applicable_id.exists' => 'El recurso seleccionado no existe.',
            'valid_until.after_or_equal' => 'La fecha de fin debe ser mayor o igual al inicio.',
        ];
    }
}

