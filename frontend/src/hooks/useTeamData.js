import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useTeamData(teamIdOverride = null) {
  const { user } = useAuth();
  const teamId = teamIdOverride ?? (user?.ownedTeamId || (user?.teamIds?.length > 0 ? user?.teamIds[0] : null));

  const [team, setTeam] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [teamRes, nodesRes, connRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/teams/${teamId}/nodes`),
        api.get(`/teams/${teamId}/connections`),
      ]);
      setTeam(teamRes.data);
      setNodes(nodesRes.data);
      setConnections(connRes.data);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { team, nodes, connections, loading, refresh: fetchData };
}
