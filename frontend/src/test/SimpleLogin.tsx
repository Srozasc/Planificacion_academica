import React, { useState } from 'react';

const SimpleLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_institucional: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login exitoso:', data);
        setError('Login exitoso! (Ver consola)');
      } else {
        const errorData = await response.json();
        console.log('Error de login:', errorData);
        setError(`Error ${response.status}: ${errorData.message || 'Credenciales incorrectas'}`);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Login Simple (Prueba)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Procesando...' : 'Login'}
        </button>
      </form>
      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: error.includes('exitoso') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${error.includes('exitoso') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: error.includes('exitoso') ? '#155724' : '#721c24',
        }}>
          {error}
        </div>
      )}

    </div>
  );
};

export default SimpleLogin;
