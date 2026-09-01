import { useState, useCallback, useEffect } from 'react';
import {
  getMesas,
  getProductos,
  getConfiguracion,
  abrirMesa,
  pausarMesa,
  reanudarMesa,
  agregarConsumo,
  cobrarMesa,
  getConsumosSesion
} from '../services/api';

export const useDashboard = (session) => {
  const [configGracia, setConfigGracia] = useState({ habilitar_gracia: false, minutos_gracia: 3 });
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados de Modales Superpuestos
  const [modalConsumoMesa, setModalConsumoMesa] = useState(null);
  const [modalCobroMesa, setModalCobroMesa] = useState(null);
  const [resumenCobro, setResumenCobro] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [dataMesas, dataProductos, dataConfig] = await Promise.all([
        getMesas().catch(() => null),
        getProductos().catch(() => []),
        getConfiguracion().catch(() => ({ habilitar_gracia: false, minutos_gracia: 3 }))
      ]);
      
      if (dataMesas && dataMesas.length > 0) {
        const sortedMesas = dataMesas.sort((a, b) => 
          String(a.numero || '').localeCompare(String(b.numero || ''), undefined, { numeric: true, sensitivity: 'base' })
        );
        setMesas(sortedMesas.map(m => (m.estado === 'LIBRE' ? { ...m, sesion_activa: null } : m)));
      }
      if (dataProductos && dataProductos.length > 0) setProductos(dataProductos);
      if (dataConfig) setConfigGracia(dataConfig);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      cargarDatos();
    }
  }, [session, cargarDatos]);

  const handleStartHora = async (idMesa, tarifaHora = 20) => {
    if (!idMesa) {
      alert('Error: El ID de la mesa es requerido');
      return;
    }
    const safeIdMesa = String(idMesa).trim();

    // Actualización optimista
    setMesas(prev => prev.map(m => 
      String(m.id_mesa) === safeIdMesa ? { 
        ...m,
        estado: 'OCUPADA',
        sesion_activa: { 
          id_sesion: `temp-${Date.now()}`,
          id_mesa: safeIdMesa,
          hora_inicio: new Date().toISOString(), 
          minutos_acumulados: 0
        } 
      } : m
    ));

    try {
      const res = await abrirMesa(safeIdMesa, tarifaHora);
      const sesionReal = res?.sesion_activa || res?.sesion;
      if (sesionReal) {
        setMesas(prev => prev.map(m =>
          String(m.id_mesa) === safeIdMesa ? {
            ...m,
            estado: 'OCUPADA',
            sesion_activa: sesionReal
          } : m
        ));
      }
      await cargarDatos();
    } catch (err) {
      console.error('[Frontend] Error al abrir mesa en backend:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Error al abrir la mesa';
      alert(`Error al abrir mesa: ${errMsg}`);
      await cargarDatos();
    }
  };

  const handlePausarHora = async (idSesion) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.sesion_activa?.id_sesion === idSesion) {
          const rawHora = m.sesion_activa.hora_inicio;
          const horaInicioStr = (typeof rawHora === 'string' && !rawHora.endsWith('Z') && !rawHora.includes('T')) ? `${rawHora}Z` : rawHora;
          const horaInicio = new Date(horaInicioStr || Date.now()).getTime();
          const horaActual = Date.now();
          const tramoSegundos = (!isNaN(horaInicio) && horaInicio > 0) ? Math.max(0, Math.floor((horaActual - horaInicio) / 1000)) : 0;
          const totalSegundos = (Number(m.sesion_activa.segundos_acumulados) || 0) + tramoSegundos;
          return {
            ...m,
            estado: 'PAUSADA',
            sesion_activa: {
              ...m.sesion_activa,
              estado: 'PAUSADA',
              segundos_acumulados: totalSegundos
            }
          };
        }
        return m;
      })
    );

    try {
      await pausarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      console.error('Error al pausar mesa en backend:', err);
      await cargarDatos();
    }
  };

  const handleReanudarHora = async (idSesion) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.sesion_activa?.id_sesion === idSesion) {
          return {
            ...m,
            estado: 'OCUPADA',
            sesion_activa: {
              ...m.sesion_activa,
              estado: 'ACTIVA',
              hora_inicio: new Date().toISOString()
            }
          };
        }
        return m;
      })
    );

    try {
      await reanudarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      console.error('Error al reanudar mesa en backend:', err);
      await cargarDatos();
    }
  };

  const handleConfirmAddConsumo = async (datosConsumo) => {
    const res = await agregarConsumo(datosConsumo);
    await cargarDatos();
    return res;
  };

  const handlePrepareCheckout = async (mesaTarget) => {
    if (!mesaTarget) return;
    const sesionId = mesaTarget.sesion_activa?.id_sesion;
    setModalCobroMesa(mesaTarget);

    try {
      let consumos = mesaTarget.sesion_activa?.consumos || [];
      if (sesionId && !String(sesionId).startsWith('demo-') && !String(sesionId).startsWith('temp-')) {
        try {
          const fetched = await getConsumosSesion(sesionId);
          if (Array.isArray(fetched) && fetched.length > 0) {
            consumos = fetched;
          }
        } catch (e) {
          console.warn('[Dashboard] Error obteniendo consumos de API:', e);
        }
      }

      const rawHora = mesaTarget.sesion_activa?.hora_inicio;
      const horaInicioStr = (typeof rawHora === 'string' && !rawHora.endsWith('Z') && !rawHora.includes('T')) ? `${rawHora}Z` : rawHora;
      const horaInicio = new Date(horaInicioStr || Date.now()).getTime();
      const horaActual = Date.now();
      const tramoSegundos = (mesaTarget.estado === 'OCUPADA' && !isNaN(horaInicio) && horaInicio > 0)
        ? Math.max(0, Math.floor((horaActual - horaInicio) / 1000))
        : 0;
      const totalSegundos = (Number(mesaTarget.sesion_activa?.segundos_acumulados) || 0) + tramoSegundos;
      const totalMins = Math.floor(totalSegundos / 60);
      const tarifa = Number(mesaTarget.tarifa_hora || 20);

      let totalTiempo = 0;
      const tieneGraciaActiva = configGracia?.habilitar_gracia;
      const minsGracia = configGracia?.minutos_gracia || 3;

      if (!tieneGraciaActiva || totalMins > minsGracia) {
        totalTiempo = Number(((totalSegundos / 3600) * tarifa).toFixed(2));
      }

      const totalConsumos = (consumos || []).reduce((acc, c) => acc + Number(c.subtotal || 0), 0);

      setResumenCobro({
        minutos_jugados: totalMins,
        total_tiempo: totalTiempo,
        total_consumos: totalConsumos,
        total_pagar: Number((totalTiempo + totalConsumos).toFixed(2)),
        consumos: consumos || []
      });
    } catch (err) {
      console.error('Error al preparar cobro:', err);
      setResumenCobro({
        minutos_jugados: 0,
        total_tiempo: 0,
        total_consumos: 0,
        total_pagar: 0,
        consumos: []
      });
    }
  };

  const handleConfirmCheckout = async (mesaTarget, metodoPago) => {
    if (!mesaTarget) return;
    const sesionId = mesaTarget?.sesion_activa?.id_sesion;
    const targetIdMesa = String(mesaTarget?.id_mesa || mesaTarget?.id);

    if (sesionId && !String(sesionId).startsWith('demo-') && !String(sesionId).startsWith('temp-')) {
      await cobrarMesa({ id_sesion: sesionId, metodo_pago: metodoPago });
    }

    setMesas((prev) =>
      prev.map((m) => {
        const currentId = String(m?.id_mesa || m?.id);
        return currentId === targetIdMesa ? { ...m, estado: 'LIBRE', sesion_activa: null } : m;
      })
    );

    setModalCobroMesa(null);
    setResumenCobro(null);
    await cargarDatos();
  };

  return {
    mesas,
    productos,
    configGracia,
    loading,
    cargarDatos,
    modalConsumoMesa,
    setModalConsumoMesa,
    modalCobroMesa,
    setModalCobroMesa,
    resumenCobro,
    setResumenCobro,
    handleStartHora,
    handlePausarHora,
    handleReanudarHora,
    handleConfirmAddConsumo,
    handlePrepareCheckout,
    handleConfirmCheckout
  };
};
