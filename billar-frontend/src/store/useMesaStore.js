import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// REGLA TÉCNICA: Resiliencia Local-First con localStorage
// Evita la pérdida de cronómetros tras refrescar la página (F5)
export const useMesaStore = create(
  persist(
    (set, get) => ({
      mesas: [
        { id: 1, numero: 'M-01', nombre: 'Mesa 1 (Tres Bandas)', estado: 'LIBRE', tarifa_hora: 15.0, sesion_activa_id: null, hora_inicio: null },
        { id: 2, numero: 'M-02', nombre: 'Mesa 2 (Pool Standard)', estado: 'LIBRE', tarifa_hora: 15.0, sesion_activa_id: null, hora_inicio: null },
        { id: 3, numero: 'M-03', nombre: 'Mesa 3 (Pool Standard)', estado: 'LIBRE', tarifa_hora: 15.0, sesion_activa_id: null, hora_inicio: null },
        { id: 4, numero: 'M-04', nombre: 'Mesa 4 (VIP Snooker)', estado: 'LIBRE', tarifa_hora: 25.0, sesion_activa_id: null, hora_inicio: null },
      ],
      productos: [
        { id: 101, nombre: 'Cerveza Club Colombia', precio: 8.0 },
        { id: 102, nombre: 'Gaseosa Coca-Cola 500ml', precio: 4.0 },
        { id: 103, nombre: 'Agua Mineral', precio: 3.0 },
        { id: 104, nombre: 'Paquete de Snack / Papas', precio: 5.0 },
      ],
      consumosLocales: {}, // { [sesionId]: [{ productoId, cantidad, subtotal, nombre }] }

      // Acciones del Store
      abrirMesaLocal: (mesaId) => {
        const horaInicio = new Date().toISOString();
        const sesionIdMock = Date.now();
        set((state) => ({
          mesas: state.mesas.map((m) =>
            m.id === mesaId
              ? { ...m, estado: 'OCUPADA', sesion_activa_id: sesionIdMock, hora_inicio: horaInicio }
              : m
          ),
          consumosLocales: { ...state.consumosLocales, [sesionIdMock]: [] }
        }));
      },

      ponerPorCobrarLocal: (mesaId) => {
        set((state) => ({
          mesas: state.mesas.map((m) =>
            m.id === mesaId ? { ...m, estado: 'POR_COBRAR' } : m
          )
        }));
      },

      cerrarMesaLocal: (mesaId) => {
        set((state) => {
          const mesa = state.mesas.find((m) => m.id === mesaId);
          const newConsumos = { ...state.consumosLocales };
          if (mesa && mesa.sesion_activa_id) {
            delete newConsumos[mesa.sesion_activa_id];
          }
          return {
            mesas: state.mesas.map((m) =>
              m.id === mesaId
                ? { ...m, estado: 'LIBRE', sesion_activa_id: null, hora_inicio: null }
                : m
            ),
            consumosLocales: newConsumos
          };
        });
      },

      agregarConsumoLocal: (sesionId, productoId, cantidad = 1) => {
        const prod = get().productos.find((p) => p.id === productoId);
        if (!prod) return;

        set((state) => {
          const listaActual = state.consumosLocales[sesionId] || [];
          const indexExistente = listaActual.findIndex((item) => item.productoId === productoId);
          
          let nuevaLista;
          if (indexExistente >= 0) {
            nuevaLista = listaActual.map((item, idx) =>
              idx === indexExistente
                ? {
                    ...item,
                    cantidad: item.cantidad + cantidad,
                    subtotal: Number(((item.cantidad + cantidad) * prod.precio).toFixed(2))
                  }
                : item
            );
          } else {
            nuevaLista = [
              ...listaActual,
              {
                productoId,
                nombre: prod.nombre,
                precio: prod.precio,
                cantidad,
                subtotal: Number((prod.precio * cantidad).toFixed(2))
              }
            ];
          }

          return {
            consumosLocales: {
              ...state.consumosLocales,
              [sesionId]: nuevaLista
            }
          };
        });
      }
    }),
    {
      name: 'billiardos-local-store',
    }
  )
);
