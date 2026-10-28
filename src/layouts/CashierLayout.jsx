import { Clock3, CreditCard, History, ShoppingBag } from 'lucide-react'

function CashierLayout({ children }) {
  const currentPath = window.location.pathname

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
            <span>Checkout preview</span>
          </a>
          <a className={`workspace-nav-item${currentPath === '/cashier/sales' ? ' is-active' : ''}`} href="/cashier/sales" aria-current={currentPath === '/cashier/sales' ? 'page' : undefined}>
            <History size={17} aria-hidden="true" />
            <span>Sales history</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-preview-icon"><Clock3 size={17} /></div>
          <div>
            <strong>No active session</strong>
            <span>This preview is not connected to a cashier account.</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb"><span>Workspace</span><span>/</span><strong>Cashier</strong></div>
          <div className="topbar-actions">
            <span className="preview-pill"><span className="status-dot" />UI preview</span>
            <a className="topbar-login-link" href="/login">Cashier sign in</a>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  )
}

export default CashierLayout
