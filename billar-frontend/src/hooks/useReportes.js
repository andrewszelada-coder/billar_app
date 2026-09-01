import { useState, useEffect, useMemo } from 'react';
import { getReportesDashboard, getMesas } from '../services/api';

export const useReportes = () => {
  const [data, setData] = useState({
    dia: { tiempo: 0, consumos: 0, total: 0 },
    semana: { tiempo: 0, consumos: 0, total: 0 },
    mes: { tiempo: 0, consumos: 0, total: 0 },
    totalSesiones: 0,
    sesionesDetalle: []
  });
  const [mesasMap, setMesasMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true);
        const [report, mesasData] = await Promise.all([
          getReportesDashboard(),
          getMesas()
        ]);
        
        if (report) setData(report);
        
        if (mesasData) {
          const map = {};
          mesasData.forEach(m => {
            const id = String(m.id_mesa || m.id);
            map[id] = m.numero || `Mesa ${id}`;
          });
          setMesasMap(map);
        }
      } catch (err) {
        console.error('Error al cargar reportes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportes();
  }, []);

  const { sesionesPorMesa, mesasIdsOrdenadas } = useMemo(() => {
    // Agrupar sesiones por mesa
    const agrupado = data.sesionesDetalle.reduce((acc, sesion) => {
      const id = String(sesion.id_mesa);
      if (!acc[id]) acc[id] = [];
      acc[id].push(sesion);
      return acc;
    }, {});

    // Ordenar mesas numéricamente/alfabéticamente
    const ordenadas = Object.keys(agrupado).sort((a, b) => {
      const nameA = mesasMap[a] || `Mesa ${a}`;
      const nameB = mesasMap[b] || `Mesa ${b}`;
      return String(nameA).localeCompare(String(nameB), undefined, { numeric: true, sensitivity: 'base' });
    });

    return { sesionesPorMesa: agrupado, mesasIdsOrdenadas: ordenadas };
  }, [data.sesionesDetalle, mesasMap]);

  return {
    data,
    loading,
    mesasMap,
    sesionesPorMesa,
    mesasIdsOrdenadas
  };
};
