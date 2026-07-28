import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductPayload, ProductResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://dummyjson.com/products';

  getProducts(search = ''): Observable<ProductResponse> {
    const url = search.trim()
      ? `${this.baseUrl}/search?q=${encodeURIComponent(search.trim())}`
      : `${this.baseUrl}?limit=100`;
    return this.http.get<ProductResponse>(url);
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
