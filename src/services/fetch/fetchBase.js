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
        credentials: 'include', // ✅ Важно! Отправляем cookies автоматически
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    if (data.success) {
        setAccessToken(data.accessToken);
        return data.accessToken;
    }

    throw new Error('Token refresh failed');
};

export async function fetchDataWithFetch(url, options = {}) {
    const { data, timeout = 30000, ...restOptions } = options; // Увеличиваем таймаут по умолчанию до 60s
    let accessToken = getAccessToken();
    
    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        let config = {
            credentials: 'include',
            signal: controller.signal, // Добавляем signal для прерывания
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
                ...options.headers,
            },
            ...restOptions,
        };

        if (data) {
            config.body = JSON.stringify(data);
            
            // Логируем размер запроса для отладки
            const requestSize = new Blob([config.body]).size;
            console.log(`📦 Размер запроса ${url}: ${(requestSize / 1024 / 1024).toFixed(2)} MB`);
        }

        let response = await fetch(`${baseURL}${url}`, config);

        // Если токен истек (401 ошибка), пытаемся обновить его
        if (response.status === 401 && !isRefreshing) {
            isRefreshing = true;

            try {
                accessToken = await refreshToken();
                
                // Повторяем запрос с новым токеном (с новым controller)
                const retryController = new AbortController();
                const retryTimeoutId = setTimeout(() => {
                    retryController.abort();
                }, timeout);
                
                try {
                    config = {
                        ...config,
                        signal: retryController.signal,
                        headers: {
                            ...config.headers,
                            'Authorization': `Bearer ${accessToken}`
                        }
                    };
                    
                    response = await fetch(`${baseURL}${url}`, config);
                } finally {
                    clearTimeout(retryTimeoutId);
                }
            } catch (error) {
                // Если обновление токена не удалось, очищаем хранилище
                clearTokens();
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