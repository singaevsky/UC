export type Product = {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  description: string | null;
  price: number;
  base_weight: number | null;
  event_types: string[];
  filling_ids: number[];
  images: string[];
  active: boolean;
};

export type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  options: any;
};
