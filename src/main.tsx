import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Theme accentColor="gray" grayColor="gray" radius="large" scaling="100%">
        <App />
      </Theme>
    </BrowserRouter>
  </StrictMode>,
)
 
