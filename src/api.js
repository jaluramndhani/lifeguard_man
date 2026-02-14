// Gunakan Environment Variable jika ada, jika tidak gunakan localhost (default)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/public/game';
const API_KEY = 'mi6-slot-api-key';

export const getBalance = async (username) => {
  try {
    console.log(`Fetching balance for ${username} from ${API_BASE_URL}/balance`);
    const response = await fetch(`${API_BASE_URL}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API Error: ${response.status} - ${text}`);
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("Balance data received:", data);
    return data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
};

export const processTransaction = async (username, action, amount, transactionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ username, action, amount, transactionId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error processing transaction:', error);
    return null;
  }
};
