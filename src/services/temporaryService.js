const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mp.sharik.ru';

export const syncUserToBackend = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing user to backend:', error);
    throw error;
  }
};