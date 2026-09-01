import { describe, it, expect, vi } from 'vitest';
import { formatearFecha, calcularSegundosTranscurridos, calcularCostoTiempo } from './dateUtils';

describe('dateUtils', () => {

  describe('formatearFecha', () => {
    it('debería retornar "N/A" si no se proporciona fecha', () => {
      expect(formatearFecha(null)).toBe('N/A');
      expect(formatearFecha('')).toBe('N/A');
    });

    it('debería formatear correctamente una fecha con Z (UTC)', () => {
      const fecha = '2023-10-25T15:30:00Z';
      const resultado = formatearFecha(fecha);
      expect(resultado).not.toBe('N/A');
      expect(resultado).toContain('25'); // El día
    });

    it('debería manejar una fecha sin Z agregándola para evitar parseos corruptos', () => {
      const fecha = '2023-10-25T15:30:00';
      const resultado = formatearFecha(fecha);
      expect(resultado).not.toBe('N/A');
    });
  });

  describe('calcularSegundosTranscurridos', () => {
    it('debería retornar 0 si no hay fecha de inicio', () => {
      expect(calcularSegundosTranscurridos(null)).toBe(0);
    });

    it('debería calcular correctamente los segundos transcurridos', () => {
      // Mock de Date.now()
      const now = new Date('2023-10-25T15:35:00Z').getTime();
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
      
      const horaInicio = '2023-10-25T15:30:00Z'; // 5 minutos antes
      const segundos = calcularSegundosTranscurridos(horaInicio);
      
      expect(segundos).toBe(300); // 5 minutos = 300 segundos
      
      dateSpy.mockRestore();
    });
  });

  describe('calcularCostoTiempo', () => {
    it('debería cobrar 0 si está dentro del tiempo de gracia', () => {
      const configGracia = { habilitar_gracia: true, minutos_gracia: 5 };
      const tarifaHora = 20;
      const segundosTotales = 240; // 4 minutos
      
      const costo = calcularCostoTiempo(segundosTotales, tarifaHora, configGracia);
      expect(costo).toBe(0);
    });

    it('debería cobrar tarifa completa si supera el tiempo de gracia', () => {
      const configGracia = { habilitar_gracia: true, minutos_gracia: 5 };
      const tarifaHora = 60; // 60 Bs / hora (1 Bs por minuto)
      const segundosTotales = 600; // 10 minutos (supera los 5 de gracia)
      
      const costo = calcularCostoTiempo(segundosTotales, tarifaHora, configGracia);
      expect(costo).toBe(10); // 10 minutos * 1 Bs/min = 10 Bs
    });

    it('debería cobrar todo si no hay tiempo de gracia habilitado', () => {
      const configGracia = { habilitar_gracia: false, minutos_gracia: 5 };
      const tarifaHora = 60;
      const segundosTotales = 120; // 2 minutos
      
      const costo = calcularCostoTiempo(segundosTotales, tarifaHora, configGracia);
      expect(costo).toBe(2);
    });
  });

});
