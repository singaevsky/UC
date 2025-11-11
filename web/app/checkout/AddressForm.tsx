// file: components/checkout/AddressForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

// ✅ Правильная схема валидации
const AddressSchema = z.object({
  city: z.string()
    .min(2, 'Название города должно содержать минимум 2 символа')
    .max(50, 'Название города слишком длинное')
    .regex(/^[а-яё\s-]+$/i, 'Название города должно содержать только русские буквы'),
  street: z.string()
    .min(2, 'Название улицы должно содержать минимум 2 символа')
    .max(100, 'Название улицы слишком длинное'),
  house: z.string()
    .min(1, 'Номер дома обязателен')
    .max(10, 'Номер дома слишком длинный')
    .regex(/^[\dа-яё\-\/]+$/i, 'Номер дома может содержать только цифры, буквы, дефис и слэш'),
  apartment: z.string()
    .max(10, 'Номер квартиры слишком длинный')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

type AddressData = z.infer<typeof AddressSchema>;

interface AddressFormProps {
  onValid: (address: AddressData) => void;
  initialData?: Partial<AddressData>;
  className?: string;
}

export function AddressForm({
  onValid,
  initialData = {},
  className = ''
}: AddressFormProps) {
  const [address, setAddress] = useState<AddressData>({
    city: initialData.city || '',
    street: initialData.street || '',
    house: initialData.house || '',
    apartment: initialData.apartment || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // ✅ Оптимизированный обработчик изменений
  const handleFieldChange = useCallback((field: keyof AddressData, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));

    // Очищаем ошибку поля при изменении
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // ✅ Оптимизированная валидация
  const validateAddress = useCallback(async () => {
    setIsValidating(true);
    setErrors({});

    try {
      const result = AddressSchema.safeParse(address);

      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          const path = issue.path[0] as string;
          errs[path] = issue.message;
        });
        setErrors(errs);
        return false;
      }

      // Вызываем callback с валидными данными
      onValid(result.data);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'Произошла ошибка валидации' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [address, onValid]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Общая ошибка */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Поле города */}
      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Город <span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          value={address.city}
          onChange={(e) => handleFieldChange('city', e.target.value)}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.city ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Например, Москва"
          aria-invalid={errors.city ? 'true' : 'false'}
          aria-describedby={errors.city ? 'city-error' : undefined}
          maxLength={50}
        />
        {errors.city && (
          <p id="city-error" className="text-red-500 text-sm mt-1" role="alert">
            {errors.city}
          </p>
        )}
      </div>

      {/* Поле улицы */}
      <div>
        <label
          htmlFor="street"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Улица <span className="text-red-500">*</span>
        </label>
        <input
          id="street"
          type="text"
          value={address.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.street ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Например, Ленинский проспект"
          aria-invalid={errors.street ? 'true' : 'false'}
          aria-describedby={errors.street ? 'street-error' : undefined}
          maxLength={100}
        />
        {errors.street && (
          <p id="street-error" className="text-red-500 text-sm mt-1" role="alert">
            {errors.street}
          </p>
        )}
      </div>

      {/* Поле дома и квартиры в одной строке */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="house"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дом <span className="text-red-500">*</span>
          </label>
          <input
            id="house"
            type="text"
            value={address.house}
            onChange={(e) => handleFieldChange('house', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.house ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Например, 15А"
            aria-invalid={errors.house ? 'true' : 'false'}
            aria-describedby={errors.house ? 'house-error' : undefined}
            maxLength={10}
          />
          {errors.house && (
            <p id="house-error" className="text-red-500 text-sm mt-1" role="alert">
              {errors.house}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="apartment"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Квартира
          </label>
          <input
            id="apartment"
            type="text"
            value={address.apartment || ''}
            onChange={(e) => handleFieldChange('apartment', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например, 45"
            maxLength={10}
          />
        </div>
      </div>

      {/* Кнопка проверки адреса */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={validateAddress}
          disabled={isValidating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isValidating ? 'Проверяем...' : 'Проверить адрес'}
        </button>
      </div>

      {/* Индикатор валидности */}
      {Object.keys(errors).length === 0 && address.city && address.street && address.house && (
        <div className="flex items-center space-x-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Адрес введён корректно</span>
        </div>
      )}
    </div>
  );
}
