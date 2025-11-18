const baseURL = process.env.REACT_APP_API_URL || 'https://mp.sharik.ru';

let isRefreshing = false;

const getAccessToken = () => {
    return sessionStorage.getItem('accessToken');
};

const setAccessToken = (token) => {
    sessionStorage.setItem('accessToken', token);
};

const clearTokens = () => {
    sessionStorage.removeItem('accessToken');
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
    const { data, ...restOptions } = options;
    let accessToken = getAccessToken();
    
    const config = {
        credentials: 'include', // ✅ Всегда включаем credentials для cookies
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

    let response = await fetch(`${baseURL}${url}`, config);

    // Если токен истек (401 ошибка), пытаемся обновить его
    if (response.status === 401 && !isRefreshing) {
        isRefreshing = true;

        try {
            accessToken = await refreshToken();
            
            // Повторяем запрос с новым токеном
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${accessToken}`
            };
            
            response = await fetch(`${baseURL}${url}`, config);
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    // Сохраняем accessToken если он пришел в ответе
    if (responseData.accessToken) {
        setAccessToken(responseData.accessToken);
    }

    return responseData;
}

// Дополнительные утилиты для работы с токенами
export const tokenUtils = {
    getAccessToken,
    setAccessToken,
    clearTokens
};