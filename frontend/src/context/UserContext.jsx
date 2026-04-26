import React, { createContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile } from '../services/queryService';
import { queryKeys } from '../lib/queryKeys';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.error) {
      localStorage.removeItem('token');
      queryClient.removeQueries({ queryKey: queryKeys.profile });
    }
  }, [profileQuery.error, queryClient]);

  const updateUser = (userData) => {
    const nextToken = userData?.token || token || null
    if (userData?.token) {
      localStorage.setItem('token', userData.token)
      setToken(userData.token)
    }
    queryClient.setQueryData(queryKeys.profile, (previous) => ({
      ...(previous || {}),
      ...userData,
      ...(nextToken ? { token: nextToken } : {}),
    }));
  }

  const clearUser = () => {
    localStorage.removeItem('token')
    setToken(null)
    queryClient.setQueryData(queryKeys.profile, null)
    queryClient.removeQueries({ queryKey: queryKeys.profile })
  }

  const value = useMemo(() => ({
    user: profileQuery.data || null,
    loading: Boolean(token) && profileQuery.status === 'pending',
    updateUser,
    clearUser,
  }), [profileQuery.data, profileQuery.status, token]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider;
