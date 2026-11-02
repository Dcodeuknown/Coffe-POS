import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, Boxes, Package } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { formatQuantity } from '../../utils/measurements.js'

function DashboardPage() {
  const [ingredients, setIngredients] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [movements, setMovements] = useState([])
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadDashboard() {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        setLoadError('You are not signed in. Please sign in again.')
        setIsLoading(false)
        return
      }
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const responses = await Promise.all([
          fetch('http://127.0.0.1:8000/ingredients', { headers }),
          fetch('http://127.0.0.1:8000/admin/menu/items', { headers }),
          fetch('http://127.0.0.1:8000/stock-movements', { headers }),
          fetch('http://127.0.0.1:8000/sales', { headers }),
        ])
        const failed = responses.find((response) => !response.ok)
        if (failed) throw new Error(`Could not load dashboard data (HTTP ${failed.status}).`)
        const [ingredientData, menuData, movementData, salesData] = await Promise.all(responses.map((response) => response.json()))
        if (isMounted) {
          setIngredients(ingredientData)
          setMenuItems(menuData)
          setMovements(movementData)
          setSales(salesData)
          setLoadError('')
        }
      } catch (error) {
        if (isMounted) setLoadError(error.message || 'Could not load dashboard data.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadDashboard()
    return () => { isMounted = false }
  }, [])

  const activeIngredients = ingredients.filter((item) => item.is_active)
  const lowStock = activeIngredients.filter((item) => Number(item.current_quantity) <= Number(item.low_stock_threshold))
  const activeMenuItems = menuItems.filter((item) => item.is_active)
  const today = new Date()
  const recentMovements = movements.slice(0, 6)
  const todaysSales = sales.filter((sale) => new Date(sale.created_at).toDateString() === today.toDateString())
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const metrics = [
    { label: 'Active menu items', value: activeMenuItems.length, detail: 'Available in the admin menu', icon: Package },
    { label: 'Active ingredients', value: activeIngredients.length, detail: 'Tracked in inventory', icon: Boxes },
    { label: 'Low or out of stock', value: lowStock.length, detail: 'At or below reorder level', icon: AlertTriangle },
    { label: 'Sales today', value: todaysSales.length, detail: `${todaysRevenue.toFixed(2)} recorded total`, icon: BarChart3 },
  ]

  return (
    <AdminLayout>
      <div className="dashboard-heading">
        <div><span className="eyebrow">STORE OVERVIEW</span><h1>Dashboard</h1><p>Current menu and inventory activity.</p></div>
        <span className="dashboard-date-label">{today.toLocaleDateString()}</span>
      </div>

      {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
      <div className="demo-data-banner" role="note"><span className="demo-banner-dot" />Dashboard values are loaded from the API. Sale totals include completed, manually recorded payments.</div>

      <section className="metric-grid" aria-label="Store inventory summary">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return <article className="metric-card" key={metric.label}><div className={`metric-icon metric-icon-${index + 1}`}><Icon size={18} aria-hidden="true" /></div><span className="metric-label">{metric.label}</span><strong className="metric-value">{isLoading ? '—' : metric.value}</strong><span className={`metric-detail${index === 2 && lowStock.length ? ' metric-detail-warning' : ''}`}>{metric.detail}</span></article>
        })}
      </section>

      <section className="dashboard-middle-grid" aria-label="Inventory overview">
        <article className="dashboard-panel chart-panel">
          <div className="panel-heading"><div><h2>Sales today</h2><p>Completed checkout records</p></div><span className="panel-period">{today.toLocaleDateString()}</span></div>
          <div className="chart-placeholder" role="status"><BarChart3 size={24} aria-hidden="true" /><strong>{isLoading ? 'Loading sales...' : `${todaysRevenue.toFixed(2)} total`}</strong><span>{isLoading ? 'Loading completed sales.' : `${todaysSales.length} completed sales recorded today.`}</span></div>
          <div className="chart-placeholder-footer"><span>Discount and tax are not configured</span></div>
        </article>

        <article className="dashboard-panel low-stock-panel">
          <div className="panel-heading"><div><h2>Low stock</h2><p>Ingredients at or below reorder level</p></div><span className="panel-count"><AlertTriangle size={14} aria-hidden="true" />{isLoading ? '—' : lowStock.length}</span></div>
          {isLoading ? <p className="catalog-table-footnote">Loading inventory...</p> : lowStock.length === 0 ? <p className="catalog-table-footnote">No active ingredients are below their reorder levels.</p> : <ul className="stock-list">{lowStock.slice(0, 6).map((item) => {
            const quantity = Number(item.current_quantity)
            const isOut = quantity <= 0
            return <li className="stock-row" key={item.id}><span className="stock-item-mark"><Package size={15} aria-hidden="true" /></span><span className="stock-item-copy"><strong>{item.name}</strong><small>{item.base_unit}</small></span><span className={`stock-level${isOut ? ' is-low' : ''}`}><strong>{formatQuantity(item.current_quantity, item.base_unit)}</strong><small>{isOut ? 'Out' : 'Low'}</small></span></li>
          })}</ul>}
          <a className="report-panel-link" href="/admin/inventory">Open inventory</a>
        </article>
      </section>

      <section className="dashboard-panel recent-sales-panel">
        <div className="panel-heading"><div><h2>Recent stock movements</h2><p>Latest API-recorded inventory activity</p></div><a className="report-panel-link" href="/admin/inventory">View inventory</a></div>
        <div className="table-scroll-region"><table className="sales-table"><thead><tr><th scope="col">Reference</th><th scope="col">Ingredient</th><th scope="col">Movement</th><th scope="col">Quantity</th><th scope="col">Time</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="5">Loading recent movements...</td></tr> : recentMovements.length === 0 ? <tr><td colSpan="5">No inventory movements have been recorded.</td></tr> : recentMovements.map((movement) => {
          const amount = Number(movement.quantity_change)
          const type = movement.movement_type === 'receipt' ? 'Receiving' : movement.movement_type === 'waste' ? 'Waste' : movement.movement_type === 'adjustment' ? 'Adjustment' : 'Sale use'
          return <tr key={movement.id}><td className="sale-id">{movement.receipt_number || `MOV-${movement.id}`}</td><td>{movement.ingredient_name}</td><td>{type}</td><td className="sale-total">{amount > 0 ? '+' : ''}{formatQuantity(amount, movement.base_unit)} {movement.base_unit}</td><td>{new Date(movement.created_at).toLocaleString()}</td></tr>
        })}</tbody></table></div>
      </section>
      <footer className="workspace-footer"><span>Bahug Nawung Coffe POS</span><span>Menu and inventory data from the API</span></footer>
    </AdminLayout>
  )
}

export default DashboardPage
