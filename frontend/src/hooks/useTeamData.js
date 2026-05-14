import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useTeamData(adminTeamId = null, viewTeamId = null) {
  const { user } = useAuth();
  const teamId = adminTeamId ?? viewTeamId ?? user?.teamId;
  const isAdmin = adminTeamId != null;

  const [team, setTeam] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    try {
      const basePath = isAdmin ? `/admin/teams/${teamId}` : `/teams/${teamId}`;
      const [teamRes, nodesRes, connRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`${basePath}/nodes`),
        api.get(`${basePath}/connections`),
      ]);
      setTeam(teamRes.data);
      setNodes(nodesRes.data);
      setConnections(connRes.data);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { team, nodes, connections, loading, refresh: fetchData };
}
