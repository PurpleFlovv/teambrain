import { useState, useEffect } from 'react';
import api from '../services/api';

export function useBrainData(teamId = null) {
  const [regions, setRegions] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const pointsUrl = teamId ? `/brain/points?teamId=${teamId}` : '/brain/points';
        const [regionsRes, pointsRes] = await Promise.all([
          api.get('/brain/regions'),
          api.get(pointsUrl),
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
  }, [teamId]);

  return { regions, points, loading };
}
