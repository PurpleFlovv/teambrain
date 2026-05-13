import { useState, useEffect } from 'react';
import api from '../services/api';

export function useBrainData() {
  const [regions, setRegions] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsRes, pointsRes] = await Promise.all([
          api.get('/brain/regions'),
          api.get('/brain/points'),
        ]);
        setRegions(regionsRes.data);
        setPoints(pointsRes.data);
      } catch (err) {
        console.error('Failed to fetch brain data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { regions, points, loading };
}
