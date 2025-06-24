import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Link } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useGlobalContext } from '@/context/GlobalContext';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentfulLoader from './ContentfulLoader';

// Используем React.memo для предотвращения лишних рендеров
const ContentfulBrowserAuth = React.memo(() => {
    const { dispatch } = useGlobalContext();
    const { 
        isLoggedIn, 
        isLoading: hookLoading,
        authUrl, 
        token, 
        setToken, 
        startLogin, 
        saveToken, 
        logout, 
        checkAuthStatus,
        setAuthUrl
    } = useAuth();
    
    const [error, setError] = useState<string>('');
    const [loginStarted, setLoginStarted] = useState<boolean>(false);
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = hookLoading || localLoading;

    const handleStartLogin = async () => {
        setError('');
        setLocalLoading(true);
        try {
            setLoginStarted(true);
            await startLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start login process');
            setLoginStarted(false);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleSaveToken = async () => {
        setError('');
        if (!token.trim()) {
            setError('Please enter a valid token');
            return;
        }
        
        setLocalLoading(true);
        try {
            await saveToken(token);
            setLoginStarted(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save token');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleLogout = async () => {
        setError('');
        setLocalLoading(true);
        
        try {
            // Добавляем таймаут для клиентской стороны
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Logout timed out')), 15000)
            );
            
            // Используем Promise.race для ограничения времени ожидания
            await Promise.race([
                logout(),
                timeoutPromise
            ]);
            
            // Принудительно проверяем статус авторизации после выхода
            await checkAuthStatus();
            
            // Сбрасываем состояние компонента
            setLoginStarted(false);
        } catch (err) {
            console.error('Error during logout:', err);
            setError('Logout process timed out. You may need to refresh the page.');
            
            // Принудительно обновляем статус авторизации
            await checkAuthStatus();
        } finally {
            setLocalLoading(false);
        }
    };

    // Добавьте функцию для полного сброса
    const handleFullReset = async () => {
        setError('');
        setLocalLoading(true);
        
        try {
            const response = await fetch('/api/reset-auth', {
                method: 'POST',
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            // Принудительно проверяем статус авторизации
            await checkAuthStatus();
            
            // Сбрасываем состояние компонента
            setLoginStarted(false);
        } catch (err) {
            console.error('Error during full reset:', err);
            setError('Reset process failed. Please try again or refresh the page.');
        } finally {
            setLocalLoading(false);
        }
    };

    // Функция для получения URL авторизации
    const getAuthUrl = async () => {
        try {
            setError('');
            setLocalLoading(true);
            
            // Получаем URL авторизации с сервера
            const response = await fetch('/api/contentful-auth-browser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'getAuthUrl' }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to get auth URL');
            }
            
            // Проверяем, что URL корректный
            if (!data.authUrl || !data.authUrl.startsWith('https://')) {
                throw new Error('Invalid auth URL received from server');
            }
            
            console.log('Auth URL from CLI:', data.authUrl);
            
            // Устанавливаем URL авторизации
            setAuthUrl(data.authUrl);
            setLoginStarted(true);
            
            // Автоматически открываем окно авторизации
            window.open(data.authUrl, '_blank');
        } catch (err) {
            console.error('Error getting auth URL:', err);
            setError(err instanceof Error ? err.message : 'Failed to get auth URL');
        } finally {
            setLocalLoading(false);
        }
    };

    // Добавьте эффект для обработки сообщений от окна авторизации
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // Проверяем, что сообщение от нашего окна авторизации
            if (event.data && event.data.type === 'CONTENTFUL_AUTH_SUCCESS') {
                const { token } = event.data;
                
                if (token) {
                    console.log('Received token from auth window');
                    
                    // Сохраняем токен
                    await saveToken(token);
                }
            }
        };
        
        // Добавляем обработчик сообщений
        window.addEventListener('message', handleMessage);
        
        // Удаляем обработчик при размонтировании
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // Функция для открытия окна авторизации
    const openAuthWindow = () => {
        if (!authUrl) return;
        
        console.log('Opening auth window with URL:', authUrl);
        
        // Открываем окно авторизации
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        // Открываем окно с опцией noopener для безопасности
        const authWindow = window.open(
            authUrl,
            'contentful-auth',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );
        
        // Проверяем, что окно открылось успешно
        if (!authWindow) {
            setError('Popup blocked! Please allow popups for this site.');
        } else {
            // Устанавливаем интервал для проверки закрытия окна
            const checkWindowClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindowClosed);
                    // Если окно закрылось, но токен не был получен, проверяем статус авторизации
                    setTimeout(() => {
                        checkAuthStatus();
                    }, 1000);
                }
            }, 500);
        }
    };

    // Если пользователь авторизован, показываем кнопку выхода
    if (isLoggedIn) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    You are logged in to Contentful.
                </Typography>
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleLogout}
                    disabled={isLoading}
                    sx={{ mb: 1 }}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Logout from Contentful'}
                </Button>
                
                {/* Кнопка для принудительного сброса */}
                <Box sx={{ mt: 1 }}>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={handleFullReset}
                        disabled={isLoading}
                        size="small"
                    >
                        Force Reset Auth
                    </Button>
                </Box>
            </Box>
        );
    }

    // Если процесс авторизации начат, показываем форму для ввода токена
    if (loginStarted) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Please open this URL in your browser to authorize:
                </Typography>
                <Link 
                    href={authUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ display: 'block', mb: 2, wordBreak: 'break-all' }}
                >
                    {authUrl}
                </Link>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    After authorization, copy the token and paste it below:
                </Typography>
                <TextField
                    fullWidth
                    label="Contentful Token"
                    variant="outlined"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    sx={{ mb: 2 }}
                />
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Button 
                    variant="contained" 
                    onClick={handleSaveToken}
                    disabled={isLoading || !token.trim()}
                    sx={{ mr: 1 }}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Save Token'}
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={() => setLoginStarted(false)}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </Box>
        );
    }

    // По умолчанию показываем кнопку для начала авторизации
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
                You need to log in to Contentful to use this tool.
            </Typography>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            {!isLoggedIn && !loginStarted && (
                <Box>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={getAuthUrl}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Login to Contentful'}
                    </Button>
                </Box>
            )}
            {!isLoggedIn && loginStarted && (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Click the button below to open the Contentful authorization page:
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={openAuthWindow}
                        disabled={isLoading}
                    >
                        Open Contentful Auth
                    </Button>
                </Box>
            )}
        </Box>
    );
});

ContentfulBrowserAuth.displayName = 'ContentfulBrowserAuth';

export default ContentfulBrowserAuth; 