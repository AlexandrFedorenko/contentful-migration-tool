import { useState, useEffect } from 'react';
// import { useContentfulBrowserAuth } from './useContentfulBrowserAuth';

export interface Space {
  sys: {
    id: string;
  };
  name: string;
}

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const { isLoggedIn } = useContentfulBrowserAuth();

  useEffect(() => {
    const fetchSpaces = async () => {
      // Не делаем запрос, если пользователь не авторизован
      // if (!isLoggedIn) {
      //   setSpaces([]);
      //   return;
      // }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/spaces');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch spaces');
        }
        
        const data = await response.json();
        setSpaces(data.spaces || []);
      } catch (err) {
        console.error('Error fetching spaces:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch spaces');
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []); // Добавляем isLoggedIn в зависимости

  return { spaces, loading, error };
}; 