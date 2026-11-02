import { useEffect, useState } from 'react'
import { Clock3, CreditCard, History, LogOut, ShoppingBag } from 'lucide-react'

function CashierLayout({ children }) {
  const currentPath = window.location.pathname
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    fetch('http://127.0.0.1:8000/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
  }, [])

  function signOut() {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('pos_cart')
    sessionStorage.removeItem('pos_last_sale')
    window.location.assign('/login')
  }

  return (
    <div className="workspace cashier-workspace">
      <aside className="workspace-sidebar cashier-sidebar">
        <a className="workspace-brand" href="/" aria-label="Bahug Nawung Coffe POS home">
          <span className="brand-mark"><ShoppingBag size={18} /></span>
          <span className="brand-copy">
            <span className="brand-name">Bahug Nawung Coffe POS</span>
            <span className="brand-caption">Cashier workspace</span>
          </span>
        </a>

        <div className="sidebar-section-label">COUNTER</div>
        <nav className="workspace-nav" aria-label="Cashier navigation">
          <a className={`workspace-nav-item${currentPath === '/cashier' ? ' is-active' : ''}`} href="/cashier" aria-current={currentPath === '/cashier' ? 'page' : undefined}>
            <ShoppingBag size={17} aria-hidden="true" />
            <span>Point of sale</span>
          </a>
          <a className={`workspace-nav-item${currentPath === '/cashier/checkout' ? ' is-active' : ''}`} href="/cashier/checkout" aria-current={currentPath === '/cashier/checkout' ? 'page' : undefined}>
            <CreditCard size={17} aria-hidden="true" />
            <span>Checkout</span>
          </a>
          <a className={`workspace-nav-item${currentPath === '/cashier/sales' ? ' is-active' : ''}`} href="/cashier/sales" aria-current={currentPath === '/cashier/sales' ? 'page' : undefined}>
            <History size={17} aria-hidden="true" />
            <span>Sales history</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-preview-icon"><Clock3 size={17} /></div>
          <div>
            <strong>{currentUser?.full_name || 'No active session'}</strong>
            <span>{currentUser ? 'Signed in to the cashier workspace.' : 'Sign in to load the live register and sales.'}</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb"><span>Workspace</span><span>/</span><strong>Cashier</strong></div>
          <div className="topbar-actions">
            <span className="preview-pill"><span className="status-dot" />{currentUser ? 'Cashier session' : 'Sign in required'}</span>
            {currentUser ? <button className="topbar-login-link" type="button" onClick={signOut}><LogOut size={14} /> Sign out</button> : <a className="topbar-login-link" href="/login">Cashier sign in</a>}
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  )
}

export default CashierLayout
