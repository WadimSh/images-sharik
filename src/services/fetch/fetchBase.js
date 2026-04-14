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
            ...(data && !(data instanceof FormData) && { 'Content-Type': 'application/json' }),
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            ...options.headers,
        },
        ...restOptions,
    };

    if (data) {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    return config;
};

const redirectToSignIn = () => {
  // Очищаем токены перед редиректом
  clearTokens();
  
  // Редирект на страницу входа
  window.location.hash = '/sign-in';
};

export async function fetchDataWithFetch(url, options = {}) {
    const originalOptions = { ...options };
    const { timeout = 600000, signal: externalSignal } = originalOptions;

    let accessToken = getAccessToken();
    
    // Создаем внутренний controller только если не передан внешний signal
    const internalController = !externalSignal ? new AbortController() : null;
    const signal = externalSignal || internalController?.signal;
    
    const timeoutId = setTimeout(() => {
        if (internalController) {
            internalController.abort();
        }
    }, timeout);

    try {
        // Создаем конфиг с текущим signal
        let config = createRequestConfig(originalOptions, accessToken, signal);

        // Логируем размер запроса
        if (config.body && !(config.body instanceof FormData)) {
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
                
                // Для повторного запроса используем тот же signal
                const retryController = !externalSignal ? new AbortController() : null;
                const retrySignal = externalSignal || retryController?.signal;
                const retryTimeoutId = setTimeout(() => {
                    if (retryController) {
                        retryController.abort();
                    }
                }, timeout);
                
                try {
                    console.log('🔄 Повторяем оригинальный запрос с новым токеном...');
                    
                    // Создаем новый конфиг с обновленным токеном
                    const retryConfig = createRequestConfig(
                        originalOptions, 
                        newAccessToken, 
                        retrySignal
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

        if (responseData.accessToken) {
            setAccessToken(responseData.accessToken);
        }

        return responseData;

    } catch (error) {
        // Обрабатываем ошибки отмены
        if (error.name === 'AbortError') {
            // Проверяем, был ли отменен внешний signal
            if (externalSignal?.aborted) {
                console.log('🛑 Запрос отменен внешним signal');
                throw error; // Пробрасываем оригинальный AbortError
            } else {
                console.log('⏰ Запрос отменен по таймауту');
                throw new Error(`Request timeout after ${timeout}ms`);
            }
        }
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Failed to connect to server');
        }
        
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Дополнительные утилиты для работы с токенами
export const tokenUtils = {
    getAccessToken,
    setAccessToken,
    clearTokens
};