// file: components/checkout/AddressForm.tsx
'use client';
import { useState } from 'react';
import { z } from 'zod';

const AddressSchema = z.object({
  city: z.string().min(2),
  street: z.string().min(2),
  house: z.string().min(1),
  apartment: z.string().optional(),
});

export function AddressForm({ onValid }: { onValid: (address: z.infer<typeof AddressSchema>) => void }) {
  const [address, setAddress] = useState<z.infer<typeof AddressSchema>>({
    city: '', street: '', house: '', apartment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const result = AddressSchema.safeParse(address);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(i => errs[i.path[0] as string] = i.message);
      setErrors(errs);
      return;
    }
    setErrors({});
    onValid(result.data);
  };

  return (
    <div>
      {/* ... поля ... */}
      <button onClick={validate}>Проверить адрес</button>
    </div>
  );
}
