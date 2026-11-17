import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SyncStateService {
  private readonly _organizationId = signal<string | null>(null);
  private readonly _organizationName = signal<string | null>(null);
  private readonly _condominiumId = signal<string | null>(null);
  private readonly _condominiumName = signal<string | null>(null);
  private readonly _condominiumApplied = signal<boolean | null>(null);
  private readonly _userId = signal<string | null>(null);
  private readonly _userEmail = signal<string | null>(null);
  private readonly _userToken = signal<string | null>(null);

  readonly organizationId = this._organizationId.asReadonly();
  readonly organizationName = this._organizationName.asReadonly();
  readonly condominiumId = this._condominiumId.asReadonly();
  readonly condominiumName = this._condominiumName.asReadonly();
  // Resposta do SindicoNet IA à troca de condomínio: true aplicado, false não encontrado, null sem resposta
  readonly condominiumApplied = this._condominiumApplied.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly userEmail = this._userEmail.asReadonly();
  readonly userToken = this._userToken.asReadonly();

  readonly hasOrganization = computed(() => this._organizationId() !== null);
  readonly hasCondominium = computed(() => this._condominiumId() !== null);
  readonly hasUser = computed(() => this._userId() !== null);

  setOrganization(id: string, name: string): void {
    this._organizationId.set(id);
    this._organizationName.set(name);
    this._condominiumId.set(null);
    this._condominiumName.set(null);
    this._condominiumApplied.set(null);
  }

  setCondominium(id: string, name: string): void {
    this._condominiumId.set(id);
    this._condominiumName.set(name);
    this._condominiumApplied.set(null);
  }

  setCondominiumApplied(applied: boolean): void {
    this._condominiumApplied.set(applied);
  }

  setUser(id: string, email: string): void {
    this._userId.set(id);
    this._userEmail.set(email);
    this._userToken.set(null);
  }

  setUserToken(token: string): void {
    this._userToken.set(token);
  }

  reset(): void {
    this._organizationId.set(null);
    this._organizationName.set(null);
    this._condominiumId.set(null);
    this._condominiumName.set(null);
    this._condominiumApplied.set(null);
    this._userId.set(null);
    this._userEmail.set(null);
    this._userToken.set(null);
  }
}
