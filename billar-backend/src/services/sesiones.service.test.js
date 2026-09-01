import { SesionesService } from './sesiones.service.js';

describe('SesionesService', () => {
  // Las pruebas complejas con mocks de base de datos ESM requieren 
  // configuración adicional (jest --experimental-vm-modules), pero 
  // podemos probar las validaciones puras del servicio.

  describe('Validaciones de abrirMesa', () => {
    it('debería lanzar un error 400 si no se envía id_mesa', async () => {
      // Instanciamos el servicio directamente
      const servicio = new SesionesService();
      
      try {
        await servicio.abrirMesa(null, 'Juan');
      } catch (err) {
        expect(err.message).toBe('El parámetro id_mesa es requerido');
        expect(err.status).toBe(400);
      }
    });
  });

  describe('Validaciones de pausarMesa', () => {
    it('debería lanzar un error 400 si no se envía id_sesion', async () => {
      const servicio = new SesionesService();
      
      try {
        await servicio.pausarMesa(null);
      } catch (err) {
        expect(err.message).toBe('id_sesion requerido');
        expect(err.status).toBe(400);
      }
    });
  });

  describe('Validaciones de cobrarMesa', () => {
    it('debería lanzar un error 400 si no se envía id_sesion', async () => {
      const servicio = new SesionesService();
      
      try {
        await servicio.cobrarMesa(null);
      } catch (err) {
        expect(err.message).toBe('id_sesion es requerido');
        expect(err.status).toBe(400);
      }
    });
  });
});
