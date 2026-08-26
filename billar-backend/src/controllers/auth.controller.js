import { supabase } from '../config/supabase.js';

export class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña requeridos', code: 'MISSING_FIELDS' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: error.message || 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
      }

      return res.json({
        mensaje: 'Inicio de sesión exitoso',
        user: data.user,
        session: data.session
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await supabase.auth.signOut();
      return res.json({ mensaje: 'Sesión cerrada correctamente' });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
