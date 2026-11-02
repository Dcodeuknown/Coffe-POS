import { useEffect, useState } from 'react'
import { ArrowUpRight, BadgeCheck, Boxes, CircleDollarSign, ShoppingBag } from 'lucide-react'
import './App.css'
import LoginPage from './pages/auth/LoginPage.jsx'
import DashboardPage from './pages/admin/DashboardPage.jsx'
import ProductsPage from './pages/admin/ProductsPage.jsx'
import CategoriesPage from './pages/admin/CategoriesPage.jsx'
import InventoryPage from './pages/admin/InventoryPage.jsx'
import PosPage from './pages/cashier/PosPage.jsx'
import CheckoutPage from './pages/cashier/CheckoutPage.jsx'
import SalesHistoryPage from './pages/cashier/SalesHistoryPage.jsx'
import { ReportsPage, SuppliersPage, UsersPage } from './pages/admin/AdminOperationsPages.jsx'

const plannedAreas = [
  {
    icon: ShoppingBag,
    title: 'Point of sale',
    description: 'A focused workspace for serving customers and preparing sales.',
  },
  {
    icon: Boxes,
    title: 'Menu and ingredients',
    description: 'Keep menu options and ingredient stock organized separately.',
  },
  {
    icon: CircleDollarSign,
    title: 'Sales overview',
    description: 'A useful view of store activity as the project grows.',
  },
]

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    function syncPathname() {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  if (pathname === '/login' || pathname === '/admin/login') {
    return <LoginPage audience={pathname === '/admin/login' ? 'admin' : 'cashier'} />
  }

  if (pathname === '/admin') return <DashboardPage />
  if (pathname === '/admin/products') return <ProductsPage />
  if (pathname === '/admin/categories') return <CategoriesPage />
  if (pathname === '/admin/inventory') return <InventoryPage />
  if (pathname === '/admin/recipes') return <ProductsPage />
  if (pathname === '/admin/suppliers') return <SuppliersPage />
  if (pathname === '/admin/users') return <UsersPage />
  if (pathname === '/admin/reports') return <ReportsPage />
  if (pathname === '/cashier/checkout') return <CheckoutPage />
  if (pathname === '/cashier/sales') return <SalesHistoryPage />
  if (pathname === '/cashier') return <PosPage />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="POS System home">
          <span className="brand-mark" aria-hidden="true">
            <ShoppingBag size={19} strokeWidth={2.1} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Bahug Nawung Coffe POS</span>
            <span className="brand-caption">Point of sale</span>
          </span>
        </a>

        <div className="preview-status" aria-label="Development preview">
          <span className="status-dot" aria-hidden="true" />
          <span>Development preview</span>
        </div>
      </header>

      <main id="home" className="main-content">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <span className="eyebrow">YOUR STORE WORKSPACE</span>
            <h1 id="welcome-title">A solid start for your POS.</h1>
            <p>
              Welcome to Bahug Nawung Coffe POS. This is the foundation for a simpler,
              more organized way to run your store.
            </p>
            <div className="foundation-note">
              <BadgeCheck size={17} aria-hidden="true" />
              <span>Project foundation is ready</span>
            </div>
            <div className="login-links" aria-label="Choose a login experience">
              <a className="login-link login-link-primary" href="/login">Cashier login</a>
              <a className="login-link login-link-secondary" href="/admin/login">Admin login</a>
            </div>
            <div className="workspace-preview-links" aria-label="Preview a workspace">
              <a href="/cashier">Cashier workspace preview <ArrowUpRight size={13} aria-hidden="true" /></a>
              <a href="/admin">Admin dashboard preview <ArrowUpRight size={13} aria-hidden="true" /></a>
            </div>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-card">
              <span className="art-card-icon"><ShoppingBag size={25} /></span>
              <span className="art-card-line line-long" />
              <span className="art-card-line line-short" />
              <span className="art-card-check"><BadgeCheck size={17} /></span>
            </div>
            <span className="art-sparkle sparkle-one">*</span>
            <span className="art-sparkle sparkle-two">+</span>
          </div>
        </section>

        <section className="areas-section" aria-labelledby="areas-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUILT IN STAGES</span>
              <h2 id="areas-title">A workspace that grows with you</h2>
            </div>
            <span className="section-count">01 <span>/ 03</span></span>
          </div>

          <div className="area-grid">
            {plannedAreas.map(({ icon: Icon, title, description }, index) => (
              <article className="area-card" key={title}>
                <div className="area-card-top">
                  <span className={`area-icon area-icon-${index + 1}`}>
                    <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <ArrowUpRight size={17} className="area-arrow" aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="coming-label"><span /> Planned</span>
              </article>
            ))}
          </div>
        </section>

        <footer className="page-footer">
          <span>Bahug Nawung Coffe POS</span>
          <span>Foundation - Batch 1</span>
        </footer>
      </main>
    </div>
  )
}

export default App
