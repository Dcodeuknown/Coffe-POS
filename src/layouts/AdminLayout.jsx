import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Package,
  Settings2,
  ShoppingBag,
  Users,
} from 'lucide-react'

const adminNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Menu items', icon: Package, href: '/admin/products' },
  { label: 'Categories', icon: Boxes, href: '/admin/categories' },
  { label: 'Inventory', icon: ClipboardList, href: '/admin/inventory' },
  { label: 'Recipes', icon: Coffee, href: '/admin/recipes' },
  { label: 'Suppliers', icon: ClipboardList, href: '/admin/suppliers' },
  { label: 'Sales', icon: ShoppingBag },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
]

function AdminLayout({ children }) {
  const currentPath = window.location.pathname

  return (
    <div className="workspace admin-workspace">
      <aside className="workspace-sidebar">
        <a className="workspace-brand" href="/" aria-label="Bahug Nawung Coffe POS home">
          <span className="brand-mark"><ShoppingBag size={18} /></span>
          <span className="brand-copy">
            <span className="brand-name">Bahug Nawung Coffe POS</span>
            <span className="brand-caption">Admin workspace</span>
          </span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="workspace-nav" aria-label="Admin navigation">
          {adminNavigation.map(({ label, icon: Icon, href }) => (
            href ? (
              <a className={`workspace-nav-item${currentPath === href ? ' is-active' : ''}`} href={href} key={label} aria-current={currentPath === href ? 'page' : undefined}>
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ) : (
              <button className="workspace-nav-item is-planned" disabled key={label} title={`${label} screen is planned for a later batch`}>
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
                <span className="nav-planned-label">Later</span>
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-preview-icon"><Settings2 size={17} /></div>
          <div>
            <strong>UI preview</strong>
            <span>Navigation is being built in stages.</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb"><span>Workspace</span><span>/</span><strong>Admin</strong></div>
          <div className="topbar-actions">
            <span className="preview-pill"><span className="status-dot" />Demo data</span>
            <a className="topbar-login-link" href="/admin/login">Admin sign in</a>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
