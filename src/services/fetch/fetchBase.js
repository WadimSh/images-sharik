const baseURL = process.env.REACT_APP_API_URL || 'https://mp.sharik.ru';

let isRefreshing = false;

const getAccessToken = () => {
    return localStorage.getItem('accessToken');
};

const setAccessToken = (token) => {
    localStorage.setItem('accessToken', token);
};

const clearTokens = () => {
    localStorage.removeItem('accessToken');
};

export const refreshToken = async () => {
    
    const response = await fetch(`${baseURL}/api/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    if (data) {
        setAccessToken(data.accessToken);
        return data.accessToken;
    }

    throw new Error('Token refresh failed');
};

// 🔥 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ КОНФИГА
const createRequestConfig = (options, accessToken, signal) => {
    const { data, ...restOptions } = options;
    
    const config = {
        credentials: 'include',
        signal,
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            ...options.headers,
        },
        ...restOptions,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    return config;
};

const redirectToSignIn = () => {
  // Очищаем токены перед редиректом
  clearTokens();
  
  // Редирект на страницу входа
  if (window.location.pathname !== '/sign-in') {
    window.location.href = '/sign-in';
  }
};

export async function fetchDataWithFetch(url, options = {}) {
    const originalOptions = { ...options };
    const { timeout = 60000 } = originalOptions;

    let accessToken = getAccessToken();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        // Создаем конфиг для первоначального запроса
        let config = createRequestConfig(originalOptions, accessToken, controller.signal);

        // Логируем размер запроса
        if (config.body) {
            const requestSize = new Blob([config.body]).size;
            console.log(`📦 Размер запроса ${url}: ${(requestSize / 1024 / 1024).toFixed(2)} MB`);
        }

        let response = await fetch(`${baseURL}${url}`, config);

        // Если токен истек (401 ошибка), пытаемся обновить его
        if (response.status === 401 && !isRefreshing) {
            isRefreshing = true;

            try {
                console.log('🔄 Токен истек, пытаемся обновить...');
                let newAccessToken = await refreshToken();
                console.log('✅ Токен успешно обновлен');
                
                // 🔥 ПОВТОРЯЕМ ЗАПРОС С НОВЫМ ТОКЕНОМ
                const retryController = new AbortController();
                const retryTimeoutId = setTimeout(() => {
                    retryController.abort();
                }, timeout);
                
                try {
                    console.log('🔄 Повторяем оригинальный запрос с новым токеном...');
                    
                    // Создаем НОВЫЙ конфиг с теми же данными и новым токеном
                    const retryConfig = createRequestConfig(
                        originalOptions, 
                        newAccessToken, 
                        retryController.signal
                    );
                    
                    response = await fetch(`${baseURL}${url}`, retryConfig);
                    console.log('✅ Повторный запрос выполнен успешно');
                } finally {
                    clearTimeout(retryTimeoutId);
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении токена:', error);
                redirectToSignIn();
                throw error;
            } finally {
                isRefreshing = false;
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            
            // Специальная обработка для больших payload
            if (response.status === 413) {
                throw new Error(`Payload too large: ${errorMessage}`);
            } else if (response.status === 408) {
                throw new Error(`Request timeout: ${errorMessage}`);
            } else if (response.status === 429) {
                throw new Error(`Rate limit exceeded: ${errorMessage}`);
            }
            
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        // Сохраняем accessToken если он пришел в ответе
        if (responseData.accessToken) {
            setAccessToken(responseData.accessToken);
        }

        return responseData;

    } catch (error) {
        // Обрабатываем ошибки таймаута и прерывания
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        // Пробрасываем сетевые ошибки
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Failed to connect to server');
        }
        
        throw error;
    } finally {
        // Всегда очищаем таймаут
        clearTimeout(timeoutId);
    }
}

// Дополнительные утилиты для работы с токенами
export const tokenUtils = {
    getAccessToken,
    setAccessToken,
    clearTokens
};