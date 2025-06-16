import React, { useState } from 'react';
import { authService } from '../services/auth.service';

const TestLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('Test: Iniciando login directo con authService');
      const response = await authService.login({ email, password });
      setResult(`Éxito: ${JSON.stringify(response)}`);
    } catch (error: any) {
      console.log('Test: Error capturado:', error);
      setResult(`Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Test Login Component</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleTest} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Login'}
        </button>
      </div>
      <div style={{ background: '#f0f0f0', padding: '10px', whiteSpace: 'pre-wrap' }}>
        {result || 'No hay resultado aún'}
      </div>
    </div>
  );
};

export default TestLogin;
