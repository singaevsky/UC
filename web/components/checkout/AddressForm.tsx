// file: components/checkout/AddressForm.tsx
'use client';
import { useState } from 'react';
import { z } from 'zod';

const AddressSchema = z.object({
  city: z.string().min(2, 'Минимум 2 символа'),
  street: z.string().min(2, 'Минимум 2 символа'),
  house: z.string().min(1, 'Обязательное поле'),
  apartment: z.string().optional(),
});

export function AddressForm({ onValid }: { onValid: (address: z.infer<typeof AddressSchema>) => void }) {
  const [address, setAddress] = useState<z.infer<typeof AddressSchema>>({
    city: '',
    street: '',
    house: '',
    apartment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleValidate = () => {
    const result = AddressSchema.safeParse(address);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(i => {
        const key = i.path[0] as string;
        errs[key] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    onValid(result.data);
  };

  return (
    <div className="space-y-3">
      <div>
        <label>Город</label>
        <input
          className={`border p-2 rounded w-full ${errors.city ? 'border-red-500' : ''}`}
          value={address.city}
          onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
        />
        {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
      </div>

      <div>
        <label>Улица</label>
        <input
          className={`border p-2 rounded w-full ${errors.street ? 'border-red-500' : ''}`}
          value={address.street}
          onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
        />
        {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
      </div>

      <div>
        <label>Дом</label>
        <input
          className={`border p-2 rounded w-full ${errors.house ? 'border-red-500' : ''}`}
          value={address.house}
          onChange={(e) => setAddress(prev => ({ ...prev, house: e.target.value }))}
        />
        {errors.house && <p className="text-red-500 text-sm">{errors.house}</p>}
      </div>

      <div>
        <label>Квартира (опционально)</label>
        <input
          className="border p-2 rounded w-full"
          value={address.apartment}
          onChange={(e) => setAddress(prev => ({ ...prev, apartment: e.target.value }))}
        />
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleValidate}
      >
        Проверить адрес
      </button>
    </div>
  );
}
