export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  thumbnail?: string;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductCategory {
  slug: string;
  name: string;
}

export type ProductPayload = Pick<
  Product,
  'title' | 'description' | 'price' | 'category' | 'stock'
>;
