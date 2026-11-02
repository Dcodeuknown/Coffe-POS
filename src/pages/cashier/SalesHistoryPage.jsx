import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ClipboardList, Eye, X } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'

const API_URL = 'http://127.0.0.1:8000'

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
function saleDate(sale) { return new Date(sale.created_at).toLocaleDateString() }

function SaleDetailDialog({ sale, onClose }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="catalog-dialog sale-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title">
      <div className="dialog-heading"><div><span className="eyebrow">TRANSACTION DETAILS</span><h2 id="sale-detail-title">{sale.sale_number}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close transaction details"><X size={18} /></button></div>
      <div className="sale-detail-meta"><span><small>Date and time</small><strong>{new Date(sale.created_at).toLocaleString()}</strong></span><span><small>Cashier</small><strong>{sale.cashier_name}</strong></span><span><small>Status</small><strong>{sale.status}</strong></span><span><small>Payment</small><strong>{sale.payment_method} · {sale.payment_status}</strong></span></div>
      <div className="sale-detail-items"><h3>Items</h3>{sale.items.map((item) => <article className="sale-detail-item" key={item.id}><div className="sale-detail-item-copy"><strong>{item.quantity} × {item.item_name}</strong><span>{item.variant_name}</span></div><b>{formatAmount(item.line_total)}</b></article>)}</div>
      <div className="sale-detail-total"><span>Subtotal</span><strong>{formatAmount(sale.subtotal)}</strong></div><div className="sale-detail-total"><span>Discount · not configured</span><strong>{formatAmount(sale.discount_amount)}</strong></div><div className="sale-detail-total"><span>Tax · not configured</span><strong>{formatAmount(sale.tax_amount)}</strong></div><div className="sale-detail-total"><span>Total</span><strong>{formatAmount(sale.total_amount)}</strong></div>
      <p className="sale-detail-demo-note">This completed sale and its recipe ingredient consumption are stored in the POS database.</p>
      <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={() => window.print()}>Print receipt</button><button className="catalog-button button-primary" type="button" onClick={onClose}>Close</button></div>
    </section>
  </div>
}

function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadSales() {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        setLoadError('Sign in with a Cashier account to view sales history.')
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch(`${API_URL}/sales`, { headers: { Authorization: `Bearer ${token}` } })
        if (!response.ok) throw new Error(`Could not load sales (HTTP ${response.status}).`)
        const data = await response.json()
        if (isMounted) { setSales(data); setLoadError('') }
      } catch (error) {
        if (isMounted) setLoadError(error.message || 'Could not load sales history.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadSales()
    return () => { isMounted = false }
  }, [])

  const dates = useMemo(() => [...new Set(sales.map((sale) => new Date(sale.created_at).toLocaleDateString()))], [sales])
  const visibleSales = useMemo(() => sales.filter((sale) => {
    const matchesSearch = `${sale.sale_number} ${sale.cashier_name}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesDate = dateFilter === 'all' || saleDate(sale) === dateFilter
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    return matchesSearch && matchesDate && matchesStatus
  }), [sales, query, dateFilter, statusFilter])

  return <CashierLayout>
    <div className="sales-history-heading"><div><span className="eyebrow">CASHIER WORKSPACE</span><h1>Sales history</h1><p>Search recorded transactions and view their receipt details.</p></div><span className="sales-history-count"><ClipboardList size={16} aria-hidden="true" />{isLoading ? 'Loading...' : `${sales.length} sales`}</span></div>
    <div className="demo-data-banner sales-history-banner" role="note"><span className="demo-banner-dot" />Cashier accounts see their own completed sales. Admin accounts can review all sales.</div>
    {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
    <section className="sales-history-card" aria-labelledby="sales-list-title"><div className="sales-list-heading"><div><h2 id="sales-list-title">Transactions</h2><p>Search by receipt number or cashier, then filter the results.</p></div><span className="sales-list-result-count">{visibleSales.length} shown</span></div>
      <div className="sales-filter-bar"><label className="sales-search-field"><span className="visually-hidden">Search sale number or cashier</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sale number or cashier" /></label><label className="sales-select-field"><CalendarDays size={15} aria-hidden="true" /><span className="visually-hidden">Filter by date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">All dates</option>{dates.map((date) => <option key={date} value={date}>{date}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></label><label className="sales-select-field"><span className="visually-hidden">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{[...new Set(sales.map((sale) => sale.status))].map((status) => <option key={status} value={status}>{status}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></label></div>
      <div className="sales-table-scroll"><table className="sales-history-table"><thead><tr><th>Sale number</th><th>Date and time</th><th>Cashier</th><th>Payment</th><th>Status</th><th>Total</th><th><span className="visually-hidden">Details</span></th></tr></thead><tbody>{isLoading ? <tr><td className="sales-empty-state" colSpan="7">Loading recorded sales...</td></tr> : visibleSales.length === 0 ? <tr><td className="sales-empty-state" colSpan="7">No saved sales match these filters.</td></tr> : visibleSales.map((sale) => <tr key={sale.id}><td><strong className="sale-order-number">{sale.sale_number}</strong></td><td>{saleDate(sale)}<small>{new Date(sale.created_at).toLocaleTimeString()}</small></td><td>{sale.cashier_name}</td><td>{sale.payment_method}</td><td><span className={`sale-status status-${sale.status.toLowerCase().replaceAll(' ', '-')}`}>{sale.status}</span></td><td><strong className="sale-row-total">{formatAmount(sale.total_amount)}</strong></td><td><button className="sale-detail-button" type="button" onClick={() => setSelectedSale(sale)} aria-label={`View ${sale.sale_number} details`}><Eye size={16} aria-hidden="true" /><span>View</span></button></td></tr>)}</tbody></table></div>
      <p className="sales-history-note">Refunds and voids are not enabled. They require a return policy and authorized review workflow.</p>
    </section>
    {selectedSale && <SaleDetailDialog sale={selectedSale} onClose={() => setSelectedSale(null)} />}
  </CashierLayout>
}

export default SalesHistoryPage
