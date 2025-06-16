import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppWrapper from './components/AppWrapper';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>
);
