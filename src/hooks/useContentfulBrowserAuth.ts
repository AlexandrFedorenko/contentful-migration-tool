import { useState, useEffect, useCallback } from 'react';
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

interface AuthStatus {
  logged_in: boolean;
  config?: string;
}

export const useContentfulBrowserAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [lastChecked, setLastChecked] = useState<number>(0);
  const [token, setToken] = useState<string>('');

  const { dispatch } = useGlobalContext();
  const { withLoading } = useLoading();

  // Проверка статуса авторизации с кэшированием
  const checkAuthStatus = useCallback(async () => {
    const now = Date.now();
    console.log('Checking auth status...');
    setIsLoading(true);
    try {
      const response = await fetch('/api/check-auth');
      const data: AuthStatus = await response.json();
      console.log('Auth status result:', data);
      setIsLoggedIn(data.logged_in);
      setLastChecked(now);
      return data;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { logged_in: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Запуск процесса авторизации
  const startLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contentful-auth-browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start-login' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.browser_url) {
        setAuthUrl(data.browser_url);
        return data.browser_url;
      } else {
        throw new Error(data.message || 'Failed to start login process');
      }
    } catch (error) {
      console.error('Error starting login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сохранение токена
  const saveToken = useCallback(async (newToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contentful-auth-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveToken', token: newToken }),
      });
      const data = await response.json();
      if (data.success) {
        setToken('');
        setIsLoggedIn(true); // мгновенно обновляем UI
        setIsLoading(false); // завершаем загрузку сразу
        return true;
      } else {
        throw new Error(data.message || 'Failed to save token');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Выход из системы
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contentful-auth-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to logout');
      }
      setIsLoggedIn(false); // мгновенно обновляем UI
      setToken('');
      setAuthUrl('');
      setIsLoading(false); // завершаем загрузку сразу
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем статус авторизации только при монтировании компонента
  useEffect(() => {
    let called = false;
    if (!called) {
      called = true;
      console.log('useContentfulBrowserAuth hook initialized3');
      checkAuthStatus();
    }
    // eslint-disable-next-line
  }, []);

  return {
    isLoggedIn,
    isLoading,
    authUrl,
    token,
    setToken,
    checkAuthStatus,
    startLogin,
    saveToken,
    logout,
    setIsLoading,
    setAuthUrl
  };
}; 