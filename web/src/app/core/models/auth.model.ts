export interface IUsuario {
  uid: string;
  nombre: string;
  email: string;
  fotoPerfil: string | null;
  proveedor: 'email' | 'google';
  nombreEquipoFantasy: string | null;
  esAdmin: boolean;
  esEntrenador: boolean;
}

export interface ICredencialesLogin {
  email: string;
  contrasena: string;
}

export interface ICredencialesRegistro {
  nombre: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
}
