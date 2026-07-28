import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Product, ProductCategory, ProductPayload, ProductResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://dummyjson.com/products';

  getProducts(search = '', category = ''): Observable<ProductResponse> {
    const query = search.trim();
    const url = category
      ? `${this.baseUrl}/category/${encodeURIComponent(category)}?limit=100`
      : query
        ? `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
        : `${this.baseUrl}?limit=100`;
    return this.http.get<ProductResponse>(url);
  }
  getCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<Array<ProductCategory | string>>(`${this.baseUrl}/categories`)
      .pipe(
        map((categories) =>
          categories.map((category) =>
            typeof category === 'string'
              ? { slug: category, name: category.replace(/-/g, ' ') }
              : category,
          ),
        ),
      );
  }
  addProduct(product: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/add`, product);
  }
  updateProduct(id: number, product: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }
  deleteProduct(id: number): Observable<Product> {
    return this.http.delete<Product>(`${this.baseUrl}/${id}`);
  }
}
