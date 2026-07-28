import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Product, ProductCategory, ProductPayload } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly productsApi = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notices = inject(NotificationService);
  private readonly locallyCreatedProductIds = new Set<number>();

  readonly searchControl = this.fb.nonNullable.control('');
  readonly categoryControl = this.fb.nonNullable.control('');
  readonly productForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
  });
  readonly products = signal<Product[]>([]);
  readonly categories = signal<ProductCategory[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');
  editingProduct: Product | null = null;
  pendingDelete: Product | null = null;
  isModalOpen = false;
  isSaving = false;
  isDeleting = false;

  constructor() {
    this.loadCategories();
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value),
        debounceTime(350),
        distinctUntilChanged(),
      ),
      this.categoryControl.valueChanges.pipe(
        startWith(this.categoryControl.value),
        distinctUntilChanged(),
      ),
    ])
      .pipe(
        switchMap(([term, category]) => {
          this.isLoading.set(true);
          this.error.set('');
          return this.productsApi.getProducts(term, category).pipe(
            catchError(() => {
              this.isLoading.set(false);
              this.error.set('Products could not be loaded. Please try again.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.products.set(this.filterBySearch(response?.products ?? [], this.searchControl.value));
        this.isLoading.set(false);
      });
  }

  refresh(): void {
    this.loadProducts();
  }
  clearFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
  }
  loadProducts(): void {
    this.isLoading.set(true);
    this.error.set('');
    this.productsApi.getProducts(this.searchControl.value, this.categoryControl.value).subscribe({
      next: (response) => {
        this.products.set(this.filterBySearch(response.products, this.searchControl.value));
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.error.set('Products could not be loaded. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
  openAdd(): void {
    this.editingProduct = null;
    this.productForm.reset({ title: '', description: '', price: 0, category: '', stock: 0 });
    this.isModalOpen = true;
  }
  openEdit(product: Product): void {
    this.editingProduct = product;
    this.productForm.setValue({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
    });
    this.isModalOpen = true;
  }
  closeModal(): void {
    if (!this.isSaving) this.isModalOpen = false;
  }

  save(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const payload: ProductPayload = this.productForm.getRawValue();
    if (this.editingProduct && this.locallyCreatedProductIds.has(this.editingProduct.id)) {
      this.updateProductInList(this.editingProduct.id, payload);
      this.isSaving = false;
      this.isModalOpen = false;
      this.notices.success('Product updated successfully.');
      return;
    }
    const request = this.editingProduct
      ? this.productsApi.updateProduct(this.editingProduct.id, payload)
      : this.productsApi.addProduct(payload);
    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: (product) => {
        if (this.editingProduct) {
          this.updateProductInList(this.editingProduct.id, { ...product, ...payload });
        } else {
          this.addProductToList({ ...product, ...payload });
        }
        this.notices.success(
          this.editingProduct ? 'Product updated successfully.' : 'Product added successfully.',
        );
        this.isModalOpen = false;
      },
      error: () => this.notices.error('The product could not be saved.'),
    });
  }

  requestDelete(product: Product): void {
    this.pendingDelete = product;
  }
  cancelDelete(): void {
    if (!this.isDeleting) this.pendingDelete = null;
  }
  confirmDelete(): void {
    const product = this.pendingDelete;
    if (!product) return;
    if (this.locallyCreatedProductIds.has(product.id)) {
      this.removeProductFromList(product.id);
      this.pendingDelete = null;
      this.notices.success('Product deleted successfully.');
      return;
    }
    this.isDeleting = true;
    this.productsApi
      .deleteProduct(product.id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.removeProductFromList(product.id);
          this.pendingDelete = null;
          this.notices.success('Product deleted successfully.');
        },
        error: () => this.notices.error('The product could not be deleted.'),
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
  trackById = (_: number, product: Product) => product.id;

  private loadCategories(): void {
    this.productsApi.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  private filterBySearch(products: Product[], search: string): Product[] {
    // DummyJSON exposes separate search and category endpoints. When both controls
    // are active, category results are narrowed by the current search phrase.
    if (!this.categoryControl.value || !search.trim()) return products;
    const term = search.trim().toLocaleLowerCase();
    return products.filter(
      (product) =>
        product.title.toLocaleLowerCase().includes(term) ||
        product.description.toLocaleLowerCase().includes(term),
    );
  }

  private addProductToList(product: Product): void {
    const productId = this.products().some((item) => item.id === product.id)
      ? Date.now()
      : product.id;
    const locallyCreatedProduct = { ...product, id: productId };
    this.locallyCreatedProductIds.add(productId);
    this.products.update((products) => [locallyCreatedProduct, ...products]);
  }

  private updateProductInList(productId: number, payload: ProductPayload): void {
    this.products.update((products) =>
      products.map((product) => (product.id === productId ? { ...product, ...payload } : product)),
    );
  }

  private removeProductFromList(productId: number): void {
    this.locallyCreatedProductIds.delete(productId);
    this.products.update((products) => products.filter((product) => product.id !== productId));
  }
}
