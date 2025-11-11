// file: components/checkout/AddressForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { safeJsonParse } from '@/lib/utils';

// ✅ Расширенная схема валидации с дополнительными проверками
const AddressSchema = z.object({
  city: z.string()
    .min(2, 'Название города должно содержать минимум 2 символа')
    .max(50, 'Название города слишком длинное')
    .regex(/^[а-яё\s-]+$/i, 'Название города должно содержать только русские буквы'),
  street: z.string()
    .min(2, 'Название улицы должно содержать минимум 2 символа')
    .max(100, 'Название улицы слишком длинное')
    .regex(/^[а-яё0-9\s\.\-\/]+$/i, 'Название улицы содержит недопустимые символы'),
  house: z.string()
    .min(1, 'Номер дома обязателен')
    .max(10, 'Номер дома слишком длинный')
    .regex(/^[\dа-яё\-\/]+$/i, 'Номер дома может содержать только цифры, буквы, дефис и слэш'),
  apartment: z.string()
    .max(10, 'Номер квартиры слишком длинный')
    .regex(/^[\dа-яё\-\/]*$/i, 'Номер квартиры содержит недопустимые символы')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

type AddressData = z.infer<typeof AddressSchema>;

interface AddressFormProps {
  onValid: (address: AddressData) => void;
  initialData?: Partial<AddressData>;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

export function AddressForm({
  onValid,
  initialData = {},
  className = '',
  disabled = false,
  showValidation = true,
}: AddressFormProps) {
  const [address, setAddress] = useState<AddressData>({
    city: initialData.city || '',
    street: initialData.street || '',
    house: initialData.house || '',
    apartment: initialData.apartment || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ✅ Оптимизированный обработчик изменений полей
  const handleFieldChange = useCallback((field: keyof AddressData, value: string) => {
    // Очищаем поле от лишних пробелов
    const cleanedValue = value.trim().replace(/\s+/g, ' ');

    setAddress(prev => ({ ...prev, [field]: cleanedValue }));

    // Очищаем ошибку поля при изменении
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Отмечаем поле как затронутое
    setTouched(prev => ({ ...prev, [field]: true }));
  }, [errors]);

  // ✅ Валидация отдельного поля
  const validateField = useCallback((field: keyof AddressData, value: string) => {
    const fieldSchema = AddressSchema.shape[field];
    const result = fieldSchema.safeParse(value || '');

    if (!result.success) {
      const fieldError = result.error.issues[0]?.message;
      setErrors(prev => ({ ...prev, [field]: fieldError || 'Некорректное значение' }));
      return false;
    }

    // Очищаем ошибку поля
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    return true;
  }, [errors]);

  // ✅ Полная валидация формы
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    setErrors({});

    try {
      // ✅ Проверяем, что все обязательные поля заполнены
      const requiredFields: (keyof AddressData)[] = ['city', 'street', 'house'];
      const emptyFields = requiredFields.filter(field => !address[field]?.trim());

      if (emptyFields.length > 0) {
        const fieldNames = {
          city: 'Город',
          street: 'Улица',
          house: 'Дом'
        };

        emptyFields.forEach(field => {
          setErrors(prev => ({
            ...prev,
            [field]: `${fieldNames[field]} обязателен для заполнения`
          }));
        });
        return false;
      }

      // ✅ Валидация каждого поля
      const validationResults = await Promise.all([
        validateField('city', address.city),
        validateField('street', address.street),
        validateField('house', address.house),
        validateField('apartment', address.apartment || ''),
      ]);

      // Если есть ошибки валидации
      if (validationResults.some(result => !result)) {
        return false;
      }

      // ✅ Финальная проверка всей схемы
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

      // ✅ Вызываем callback с валидными данными
      onValid(result.data);
      return true;

    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'Произошла ошибка валидации' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [address, validateField, onValid]);

  // ✅ Обработчик blur для валидации полей при потере фокуса
  const handleBlur = useCallback((field: keyof AddressData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, address[field]);
  }, [address, validateField]);

  // ✅ Автоматическая валидация при изменении (debounced)
  useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        validateForm();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address, touched, validateForm]);

  // ✅ Компонент отображения ошибки
  const ErrorMessage = ({ field }: { field: keyof AddressData }) => {
    if (!showValidation || !touched[field] || !errors[field]) {
      return null;
    }

    return (
      <p className="text-red-500 text-sm mt-1 flex items-center" role="alert">
        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Общая ошибка */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Поле города */}
      <div>
        <label
          htmlFor="address-city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Город <span className="text-red-500">*</span>
        </label>
        <input
          id="address-city"
          type="text"
          value={address.city}
          onChange={(e) => handleFieldChange('city', e.target.value)}
          onBlur={() => handleBlur('city')}
          disabled={disabled}
          className={`input-field ${errors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          placeholder="Например, Москва"
          aria-invalid={errors.city ? 'true' : 'false'}
          aria-describedby={errors.city ? 'city-error' : undefined}
          maxLength={50}
        />
        <ErrorMessage field="city" />
      </div>

      {/* Поле улицы */}
      <div>
        <label
          htmlFor="address-street"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Улица <span className="text-red-500">*</span>
        </label>
        <input
          id="address-street"
          type="text"
          value={address.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          onBlur={() => handleBlur('street')}
          disabled={disabled}
          className={`input-field ${errors.street ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          placeholder="Например, Ленинский проспект"
          aria-invalid={errors.street ? 'true' : 'false'}
          aria-describedby={errors.street ? 'street-error' : undefined}
          maxLength={100}
        />
        <ErrorMessage field="street" />
      </div>

      {/* Поле дома и квартиры в одной строке */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="address-house"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дом <span className="text-red-500">*</span>
          </label>
          <input
            id="address-house"
            type="text"
            value={address.house}
            onChange={(e) => handleFieldChange('house', e.target.value)}
            onBlur={() => handleBlur('house')}
            disabled={disabled}
            className={`input-field ${errors.house ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Например, 15А"
            aria-invalid={errors.house ? 'true' : 'false'}
            aria-describedby={errors.house ? 'house-error' : undefined}
            maxLength={10}
          />
          <ErrorMessage field="house" />
        </div>

        <div>
          <label
            htmlFor="address-apartment"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Квартира
          </label>
          <input
            id="address-apartment"
            type="text"
            value={address.apartment || ''}
            onChange={(e) => handleFieldChange('apartment', e.target.value)}
            onBlur={() => handleBlur('apartment')}
            disabled={disabled}
            className={`input-field ${errors.apartment ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Например, 45"
            aria-invalid={errors.apartment ? 'true' : 'false'}
            aria-describedby={errors.apartment ? 'apartment-error' : undefined}
            maxLength={10}
          />
          <ErrorMessage field="apartment" />
        </div>
      </div>

      {/* ✅ Дополнительная информация о форме */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
        <p className="font-medium mb-1">Подсказки:</p>
        <ul className="space-y-1">
          <li>• Используйте только русские буквы для названий города и улицы</li>
          <li>• Номер дома может содержать цифры, буквы, дефис и слэш</li>
          <li>• Поля, отмеченные звездочкой (*), обязательны для заполнения</li>
        </ul>
      </div>

      {/* Кнопка проверки адреса */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={validateForm}
          disabled={disabled || isValidating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center"
        >
          {isValidating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Проверяем...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Проверить адрес
            </>
          )}
        </button>
      </div>

      {/* ✅ Индикатор валидности */}
      {Object.keys(errors).length === 0 &&
       address.city && address.street && address.house && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Адрес введён корректно</span>
        </div>
      )}
    </div>
  );
}

// ✅ Хук для использования формы адреса в других компонентах
export function useAddressForm() {
  const [address, setAddress] = useState<AddressData | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAddress = useCallback(async (addressData: AddressData) => {
    const result = AddressSchema.safeParse(addressData);
    if (result.success) {
      setAddress(result.data);
      setIsValid(true);
      setErrors({});
      return true;
    } else {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        errs[path] = issue.message;
      });
      setErrors(errs);
      setIsValid(false);
      return false;
    }
  }, []);

  const clearAddress = useCallback(() => {
    setAddress(null);
    setIsValid(false);
    setErrors({});
  }, []);

  return {
    address,
    isValid,
    errors,
    validateAddress,
    clearAddress,
  };
}
