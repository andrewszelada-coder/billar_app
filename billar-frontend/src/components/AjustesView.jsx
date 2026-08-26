import React, { useState, useEffect } from 'react';
import { crearMesa, actualizarMesa, eliminarMesa, getConfiguracion, guardarConfiguracion } from '../services/api';

const AjustesView = ({ mesas, onReloadMesas }) => {
  // Formulario Crear Mesa
  const [nuevaMesaNombre, setNuevaMesaNombre] = useState('');
  const [nuevaMesaTipo, setNuevaMesaTipo] = useState('Pool');
  const [nuevaMesaTarifa, setNuevaMesaTarifa] = useState('20');
  const [loadingCrear, setLoadingCrear] = useState(false);

  // Configuración de Minutos de Gracia (Deshabilitado por defecto)
  const [habilitarGracia, setHabilitarGracia] = useState(false);
  const [minutosGracia, setMinutosGracia] = useState(3);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Estado Modal Edición
  const [mesaEditar, setMesaEditar] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('Pool');
  const [editTarifa, setEditTarifa] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Alertas
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const conf = await getConfiguracion();
        if (conf) {
          setHabilitarGracia(Boolean(conf.habilitar_gracia));
          setMinutosGracia(conf.minutos_gracia || 3);
        }
      } catch (err) {
        console.error('Error al cargar configuración de gracia:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault();
    setLoadingConfig(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      await guardarConfiguracion({
        habilitar_gracia: habilitarGracia,
        minutos_gracia: Number(minutosGracia)
      });
      setMensaje({
        tipo: 'exito',
        texto: habilitarGracia
          ? `Minutos de gracia habilitados (${minutosGracia} min de tolerancia inicial)`
          : 'Minutos de gracia deshabilitados (se cobrará desde el primer minuto)'
      });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al guardar la configuración de gracia' });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleCrearMesa = async (e) => {
    e.preventDefault();
    if (!nuevaMesaNombre.trim()) return;

    setLoadingCrear(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      await crearMesa({
        numero: nuevaMesaNombre,
        tipo: nuevaMesaTipo,
        tarifa_hora: Number(nuevaMesaTarifa)
      });
      setNuevaMesaNombre('');
      setNuevaMesaTipo('Pool');
      setNuevaMesaTarifa('20');
      setMensaje({ tipo: 'exito', texto: 'Mesa creada e incorporada exitosamente' });
      onReloadMesas();
    } catch (err) {
      console.error('[AjustesView] Error al crear mesa:', err);
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al crear la mesa' });
    } finally {
      setLoadingCrear(false);
    }
  };

  const openModalEditar = (mesa) => {
    setMesaEditar(mesa);
    setEditNombre(mesa.numero);
    setEditTipo(mesa.tipo || 'Pool');
    setEditTarifa(mesa.tarifa_hora);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!mesaEditar || !editNombre.trim()) return;

    setLoadingEdit(true);
    try {
      await actualizarMesa(mesaEditar.id_mesa, {
        numero: editNombre,
        tipo: editTipo,
        tarifa_hora: Number(editTarifa)
      });
      setMesaEditar(null);
      setMensaje({ tipo: 'exito', texto: `Mesa "${editNombre}" actualizada exitosamente` });
      onReloadMesas();
    } catch (err) {
      console.error('[AjustesView] Error al actualizar mesa:', err);
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al actualizar la mesa' });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleEliminarMesa = async (id_mesa, numero) => {
    if (!window.confirm(`¿Seguro que deseas eliminar ${numero}?`)) return;
    try {
      await eliminarMesa(id_mesa);
      setMensaje({ tipo: 'exito', texto: `${numero} eliminada exitosamente` });
      onReloadMesas();
    } catch (err) {
      console.error('[AjustesView] Error al eliminar mesa:', err);
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al eliminar mesa' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header Estilo SaaS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">⚙️ Configuración de Mesas & Tolerancia</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administra las mesas del local, sus tarifas por hora y las opciones de tiempo de gracia
        </p>
      </div>

      {mensaje.texto && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Grid Lado a Lado: Opciones de Tolerancia + Formulario Agregar Mesa (Izquierda) vs Lista de Mesas (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado Izquierdo (4 columnas) */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          {/* Card Configuración de Tiempo de Gracia */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">⏳ Tiempo de Gracia / Tolerancia</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permite otorgar minutos libres iniciales antes de empezar a cobrar el tiempo
              </p>
            </div>

            <form onSubmit={handleGuardarConfiguracion} className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Habilitar Minutos de Gracia
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {habilitarGracia ? 'Tolerancia activa' : 'Deshabilitado (se cobra desde min 1)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={habilitarGracia}
                    onChange={(e) => setHabilitarGracia(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {habilitarGracia && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Minutos de Tolerancia Inicial
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={minutosGracia}
                    onChange={(e) => setMinutosGracia(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:outline-hidden font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingConfig}
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700 dark:border-slate-600"
              >
                {loadingConfig ? 'Guardando...' : 'Guardar Opciones de Gracia'}
              </button>
            </form>
          </div>

          {/* Card Agregar Nueva Mesa */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">➕ Agregar Nueva Mesa</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Incorpora una mesa asignando su tarifa propia</p>
            </div>

            <form onSubmit={handleCrearMesa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nombre / Número de Mesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mesa 5"
                  value={nuevaMesaNombre}
                  onChange={(e) => setNuevaMesaNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tipo de Mesa
                </label>
                <select
                  value={nuevaMesaTipo}
                  onChange={(e) => setNuevaMesaTipo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:outline-hidden"
                >
                  <option value="Pool">Pool</option>
                  <option value="Tres Bandas">Tres Bandas</option>
                  <option value="Cacho">Cacho</option>
                  <option value="Fútbol Botón">Fútbol Botón</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tarifa Por Hora (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 font-bold text-slate-400 text-sm">Bs</span>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={nuevaMesaTarifa}
                    onChange={(e) => setNuevaMesaTarifa(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2.5 font-mono text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingCrear || !nuevaMesaNombre}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loadingCrear ? 'Creando...' : 'Crear e Incorporar Mesa'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Mesas Registradas con CRUD (7 columnas) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              📋 Mesas Registradas ({mesas.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tarifas Individuales</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mesas.map((m) => (
              <div
                key={m.id_mesa}
                className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                      {m.numero}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                      Tipo: {m.tipo || 'Pool'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-200 dark:border-emerald-800">
                    Bs {m.tarifa_hora}/hr
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-800 pt-2.5">
                  <button
                    onClick={() => openModalEditar(m)}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-600"
                  >
                    <span>✏️</span> Editar
                  </button>
                  <button
                    onClick={() => handleEliminarMesa(m.id_mesa, m.numero)}
                    className="bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 border border-red-200 dark:border-red-800"
                  >
                    <span>🗑️</span> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Edición de Mesa */}
      {mesaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-slate-800 dark:text-slate-100 relative">
            <button
              onClick={() => setMesaEditar(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">✏️ Editar {mesaEditar.numero}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Modifica la tarifa o datos de la mesa</p>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Nombre / Número de Mesa
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Tipo de Mesa
                </label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                >
                  <option value="Pool">Pool</option>
                  <option value="Tres Bandas">Tres Bandas</option>
                  <option value="Cacho">Cacho</option>
                  <option value="Fútbol Botón">Fútbol Botón</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Tarifa Por Hora (Bs)
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={editTarifa}
                  onChange={(e) => setEditTarifa(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMesaEditar(null)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEdit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  {loadingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AjustesView;
