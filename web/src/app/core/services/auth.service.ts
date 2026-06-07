import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { ICredencialesLogin, ICredencialesRegistro, IUsuario } from '../models/auth.model';
import { SupabaseService } from './supabase.service';

const ERRORES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
  'User already registered': 'Ya existe una cuenta con ese email',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Formato de email no válido',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);

  readonly usuario = signal<IUsuario | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.actualizarUsuario(data.session);
      this.cargando.set(false);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.actualizarUsuario(session);
    });
  }

  async loginConEmail(creds: ICredencialesLogin): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    const { error } = await this.supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.contrasena,
    });
    this.cargando.set(false);
    if (error) this.error.set(this.traducirError(error.message));
  }

  async registrarConEmail(creds: ICredencialesRegistro): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    const { error } = await this.supabase.auth.signUp({
      email: creds.email,
      password: creds.contrasena,
      options: { data: { nombre: creds.nombre } },
    });
    this.cargando.set(false);
    if (error) this.error.set(this.traducirError(error.message));
  }

  async loginConGoogle(returnUrl: string): Promise<void> {
    this.error.set(null);
    const redirectTo = `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`;
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) this.error.set(this.traducirError(error.message));
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/']);
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private actualizarUsuario(session: Session | null): void {
    if (!session?.user) {
      this.usuario.set(null);
      return;
    }
    const u = session.user;
    const proveedor = u.app_metadata['provider'] === 'google' ? 'google' : 'email';
    this.usuario.set({
      uid: u.id,
      nombre: u.user_metadata['nombre'] ?? u.user_metadata['full_name'] ?? u.email ?? '',
      email: u.email ?? '',
      fotoPerfil: u.user_metadata['avatar_url'] ?? null,
      proveedor,
    });
  }

  private traducirError(mensaje: string): string {
    return ERRORES[mensaje] ?? 'Ha ocurrido un error. Inténtalo de nuevo.';
  }
}
