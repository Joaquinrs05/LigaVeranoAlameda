import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { ICredencialesLogin, ICredencialesRegistro, IUsuario } from '../models/auth.model';
import { SupabaseService } from './supabase.service';

const ERRORES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
  'User already registered': 'Ya existe una cuenta con ese email',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Formato de email no válido',
  'email rate limit exceeded': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'over_email_send_rate_limit': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
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
    this.supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        // Validar contra el servidor que el usuario sigue existiendo
        const { error } = await this.supabase.auth.getUser();
        if (error) {
          // Usuario borrado de Supabase — limpiar sesión local
          await this.supabase.auth.signOut();
        } else {
          this.actualizarUsuario(data.session);
          this.fetchPerfil(data.session.user.id);
        }
      }
      this.cargando.set(false);
    });

    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      this.actualizarUsuario(session);
      if (event === 'SIGNED_IN' && session?.user) {
        this.fetchPerfil(session.user.id);
      }
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
    if (error) this.error.set(this.traducirError(error.message, error.code));
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
    if (error) this.error.set(this.traducirError(error.message, error.code));
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

  async actualizarPerfil(cambios: { nombre?: string; nombreEquipoFantasy?: string }): Promise<void> {
    const uid = this.usuario()?.uid;
    if (!uid) return;

    const { error } = await this.supabase
      .from('perfiles')
      .update({
        ...(cambios.nombre !== undefined && { nombre: cambios.nombre }),
        ...(cambios.nombreEquipoFantasy !== undefined && { nombre_equipo_fantasy: cambios.nombreEquipoFantasy }),
      })
      .eq('id', uid);

    if (!error) {
      this.usuario.update(u => u ? { ...u, ...cambios } : null);
    }
  }

  private async fetchPerfil(uid: string): Promise<void> {
    const [perfilRes, equipoRes] = await Promise.all([
      this.supabase
        .from('perfiles')
        .select('nombre, foto_perfil, nombre_equipo_fantasy, is_superadmin')
        .eq('id', uid)
        .single(),
      this.supabase
        .from('equipos')
        .select('id')
        .eq('entrenador_id', uid)
        .maybeSingle(),
    ]);

    const data = perfilRes.data;
    if (data) {
      this.usuario.update(u => u ? {
        ...u,
        nombre: data['nombre'] || u.nombre,
        fotoPerfil: data['foto_perfil'] ?? u.fotoPerfil,
        nombreEquipoFantasy: data['nombre_equipo_fantasy'] ?? null,
        esAdmin: data['is_superadmin'] === true,
        esEntrenador: !!equipoRes.data,
      } : null);
    }
  }

  private actualizarUsuario(session: Session | null): void {
    if (!session?.user) {
      this.usuario.set(null);
      return;
    }
    const u = session.user;
    this.usuario.set({
      uid: u.id,
      nombre: u.user_metadata['nombre'] ?? u.user_metadata['full_name'] ?? u.email ?? '',
      email: u.email ?? '',
      fotoPerfil: u.user_metadata['avatar_url'] ?? null,
      proveedor: u.app_metadata['provider'] === 'google' ? 'google' : 'email',
      nombreEquipoFantasy: null,
      esAdmin: false,
      esEntrenador: false,
    });
  }

  private traducirError(mensaje: string, code?: string): string {
    return ERRORES[code ?? ''] ?? ERRORES[mensaje] ?? 'Ha ocurrido un error. Inténtalo de nuevo.';
  }
}
