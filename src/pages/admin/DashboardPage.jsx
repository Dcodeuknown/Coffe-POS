import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Boxes, CircleDollarSign, Package, ShoppingBag } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoLowStock, demoMetrics, demoRecentSales } from '../../data/demoDashboardData.js'

const metricIcons = {
  sales: CircleDollarSign,
  orders: ShoppingBag,
  products: Package,
  stock: Boxes,
}

function DashboardPage() {
  return (
    <AdminLayout>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">STORE OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>A quick look at today's store activity.</p>
        </div>
        <span className="dashboard-date-label">Today <span>·</span> Demo preview</span>
      </div>

      <div className="demo-data-banner" role="note">
        <span className="demo-banner-dot" />
        Demo data shown for layout preview. No store records are loaded or saved.
      </div>

      {/* TODO (MANUAL): Load real coffee-shop sales, menu availability, and ingredient summary from the dashboard API. */}
      <section className="metric-grid" aria-label="Demo store summary">
        {demoMetrics.map((metric, index) => {
          const Icon = metricIcons[metric.icon]
          const TrendIcon = index === 3 ? ArrowDownRight : ArrowUpRight

          return (
            <article className="metric-card" key={metric.label}>
              <div className={`metric-icon metric-icon-${index + 1}`}><Icon size={18} aria-hidden="true" /></div>
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className={`metric-detail${index === 3 ? ' metric-detail-warning' : ''}`}>
                {(index === 0 || index === 3) && <TrendIcon size={13} aria-hidden="true" />}
                {metric.detail}
              </span>
            </article>
          )
        })}
      </section>

      <section className="dashboard-middle-grid" aria-label="Demo sales and stock panels">
        <article className="dashboard-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Sales overview</h2>
              <p>Sales chart panel</p>
            </div>
            <span className="panel-period">This week</span>
          </div>
          {/* TODO (MANUAL): Request dated sales totals from the reports API; add a chart only after choosing a charting approach. */}
          <div className="chart-placeholder" role="note">
            <BarChart3 size={24} aria-hidden="true" />
            <strong>Chart visualization goes here</strong>
            <span>Reporting data and chart behavior will be added later.</span>
          </div>
          <div className="chart-placeholder-footer"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
        </article>

        <article className="dashboard-panel low-stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Low stock</h2>
              <p>Items to keep an eye on</p>
            </div>
            <span className="panel-count"><AlertTriangle size={14} aria-hidden="true" />{demoLowStock.length}</span>
          </div>
          {/* TODO (MANUAL): Load low-stock items using backend inventory rules and show API loading/error states. */}
          <ul className="stock-list">
            {demoLowStock.map((item) => (
              <li className="stock-row" key={item.sku}>
                <span className="stock-item-mark"><Package size={15} aria-hidden="true" /></span>
                <span className="stock-item-copy"><strong>{item.name}</strong><small>{item.sku}</small></span>
                <span className={`stock-level${item.status === 'Low' || item.status === 'Out' ? ' is-low' : ''}`}>
                  <strong>{item.quantity}</strong><small>{item.status}</small>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-panel recent-sales-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent sales</h2>
            <p>Latest demo transactions</p>
          </div>
          <span className="table-demo-label">DEMO ONLY</span>
        </div>
        {/* TODO (MANUAL): Fetch permitted coffee-shop sales history; enforce access rules on the backend. */}
        <div className="table-scroll-region">
          <table className="sales-table">
            <thead>
              <tr><th scope="col">Sale</th><th scope="col">Demo items</th><th scope="col">Order type</th><th scope="col">Time</th><th scope="col">Payment</th><th scope="col">Total</th></tr>
            </thead>
            <tbody>
              {demoRecentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="sale-id">{sale.id}</td>
                  <td>{sale.items}</td>
                  <td>{sale.orderType}</td>
                  <td>{sale.time}</td>
                  <td><span className="payment-chip">{sale.payment}</span></td>
                  <td className="sale-total">{sale.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="workspace-footer"><span>Bahug Nawung Coffe POS</span><span>Dashboard UI preview · Demo content</span></footer>
    </AdminLayout>
  )
}

export default DashboardPage
