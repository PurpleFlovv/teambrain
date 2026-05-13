import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useTeamData() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      const [teamRes, nodesRes, connRes] = await Promise.all([
        api.get(`/teams/${user.teamId}`),
        api.get(`/teams/${user.teamId}/nodes`),
        api.get(`/teams/${user.teamId}/connections`),
      ]);
      setTeam(teamRes.data);
      setNodes(nodesRes.data);
      setConnections(connRes.data);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { team, nodes, connections, loading, refresh: fetchData };
}
