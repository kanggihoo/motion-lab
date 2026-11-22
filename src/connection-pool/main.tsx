import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Essay } from './Essay'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Essay />
  </StrictMode>,
)
