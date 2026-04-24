import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
