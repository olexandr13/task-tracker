import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { pageSnapshot } from './app/pageSnapshot'
import './styles.css'

const root = document.getElementById('root')!

// The page as this tab last left it, over the page while it loads again (UI-86).
pageSnapshot.show(new Date())
pageSnapshot.keep(root, () => new Date())

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
