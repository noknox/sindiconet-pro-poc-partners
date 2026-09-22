import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SyncStateService {
  private readonly _organizationId = signal<string | null>(null);
  private readonly _organizationName = signal<string | null>(null);
  private readonly _condominiumId = signal<string | null>(null);
  private readonly _condominiumName = signal<string | null>(null);
  private readonly _userId = signal<string | null>(null);
  private readonly _userEmail = signal<string | null>(null);

  readonly organizationId = this._organizationId.asReadonly();
  readonly organizationName = this._organizationName.asReadonly();
  readonly condominiumId = this._condominiumId.asReadonly();
  readonly condominiumName = this._condominiumName.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly userEmail = this._userEmail.asReadonly();

  readonly hasOrganization = computed(() => this._organizationId() !== null);
  readonly hasCondominium = computed(() => this._condominiumId() !== null);
  readonly hasUser = computed(() => this._userId() !== null);

  setOrganization(id: string, name: string): void {
    this._organizationId.set(id);
    this._organizationName.set(name);
    this._condominiumId.set(null);
    this._condominiumName.set(null);
  }

  setCondominium(id: string, name: string): void {
    this._condominiumId.set(id);
    this._condominiumName.set(name);
  }

  setUser(id: string, email: string): void {
    this._userId.set(id);
    this._userEmail.set(email);
  }

  reset(): void {
    this._organizationId.set(null);
    this._organizationName.set(null);
    this._condominiumId.set(null);
    this._condominiumName.set(null);
    this._userId.set(null);
    this._userEmail.set(null);
  }
}
