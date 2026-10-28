import { useState } from 'react'
import { CalendarDays, ChevronDown, ClipboardList, Eye, FileText, Search, X } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'
import { demoCashiers, demoSales } from '../../data/demoSalesData.js'

function SaleDetailDialog({ sale, onClose, onRequestAction, onOpenReceipt }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog sale-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">TRANSACTION DETAILS</span>
            <h2 id="sale-detail-title">{sale.id}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close transaction details"><X size={18} /></button>
        </div>
        <div className="sale-detail-meta">
          <span><small>Date and time</small><strong>{sale.date} · {sale.time}</strong></span>
          <span><small>Cashier</small><strong>{sale.cashier}</strong></span>
          <span><small>Order type</small><strong>{sale.orderType}</strong></span>
          <span><small>Status</small><strong className={`sale-status status-${sale.status.toLowerCase().replaceAll(' ', '-')}`}>{sale.status}</strong></span>
        </div>
        <div className="sale-detail-items">
          <h3>Items</h3>
          {sale.items.map((item) => (
            <article className="sale-detail-item" key={item.id}>
              <div className="sale-detail-item-copy">
                <strong>{item.quantity} × {item.name}</strong>
                <span>{item.variant}</span>
                <small>{item.modifiers}</small>
              </div>
              <b>{item.price}</b>
            </article>
          ))}
        </div>
        <div className="sale-detail-total"><span>Total · demo</span><strong>{sale.total}</strong></div>
        <div className="sale-detail-payment"><span>Payment method</span><strong>{sale.payment}</strong></div>
        <p className="sale-detail-demo-note">Line items and totals are sample data. This cashier preview does not show ingredient consumption records.</p>
        <div className="dialog-actions sale-detail-actions">
          <button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button>
          <button className="catalog-button button-quiet" type="button" onClick={() => onOpenReceipt(sale)}><FileText size={15} aria-hidden="true" /> View receipt</button>
          <button className="catalog-button button-quiet" type="button" onClick={() => onRequestAction(sale, 'refund')}><FileText size={15} aria-hidden="true" /> Request refund</button>
          <button className="catalog-button button-primary" type="button" onClick={() => onRequestAction(sale, 'void')} disabled={sale.status !== 'Completed'}>Request void</button>
        </div>
      </section>
    </div>
  )
}

function SaleReceiptDialog({ sale, onClose, onPrint }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog sale-receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-receipt-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">RECEIPT PREVIEW</span><h2 id="sale-receipt-title">{sale.id}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close receipt preview"><X size={18} /></button>
        </div>
        <div className="sale-receipt-paper">
          <strong>Bahug Nawung Coffe POS</strong>
          <span>{sale.date} - {sale.time}</span>
          <span>{sale.orderType} - {sale.id}</span>
          <div className="sale-receipt-items">{sale.items.map((item) => <div className="sale-receipt-item" key={item.id}><span><b>{item.quantity} x {item.name}</b><small>{item.variant} - {item.modifiers}</small></span><strong>{item.price}</strong></div>)}</div>
          <div className="sale-receipt-total"><span>Total - demo</span><strong>{sale.total}</strong></div>
          <span>Payment: {sale.payment}</span>
          <small>Sample receipt only</small>
        </div>
        <p className="sale-detail-demo-note">This receipt is static demo content and is not evidence of a completed sale.</p>
        <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button><button className="catalog-button button-primary" type="button" onClick={onPrint}><FileText size={15} aria-hidden="true" /> Print preview</button></div>
      </section>
    </div>
  )
}

function SaleActionDialog({ sale, action, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const actionLabel = action === 'refund' ? 'refund' : 'void'
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog sale-action-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-action-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">REQUEST PREVIEW</span>
            <h2 id="sale-action-title">Request {actionLabel}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close request preview"><X size={18} /></button>
        </div>
        {!showConfirmation ? (
          <>
            <p className="sale-action-copy">This will not change the sample transaction. A real {actionLabel} request needs an authorized review and the shop's return policy.</p>
            <div className="sale-action-reference"><span>Transaction</span><strong>{sale.id} - {sale.total}</strong></div>
            <label className="sale-reason-label" htmlFor="sale-action-reason">Reason for request</label>
            <textarea id="sale-action-reason" className="sale-reason-input" rows="4" placeholder="Describe why this request is needed" value={reason} onChange={(event) => setReason(event.target.value)} />
            <p className="sale-action-hint">Reason entry preview only. Nothing is submitted or saved.</p>
            <div className="dialog-actions">
              <button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button>
              <button className="catalog-button button-primary" type="button" onClick={() => setShowConfirmation(true)}>Review request</button>
            </div>
          </>
        ) : (
          <>
            <p className="sale-action-copy">Confirm this sample {actionLabel} request preview. It will not update the transaction or send a request.</p>
            <div className="sale-action-reference"><span>Reason preview</span><strong>{reason.trim() || 'No reason entered'}</strong></div>
            <div className="dialog-actions">
              <button className="catalog-button button-quiet" type="button" onClick={() => setShowConfirmation(false)}>Edit reason</button>
              <button className="catalog-button button-primary" type="button" onClick={() => { onSubmit(reason); onClose() }}>Confirm preview</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function SalesHistoryPage() {
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [cashierFilter, setCashierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState(null)
  const [actionRequest, setActionRequest] = useState(null)
  const [receiptSale, setReceiptSale] = useState(null)

  // This only filters the local demo rows; replace with API query parameters in your own integration work.
  const visibleSales = demoSales.filter((sale) => {
    const searchMatches = `${sale.id} ${sale.cashier}`.toLowerCase().includes(query.trim().toLowerCase())
    const dateMatches = dateFilter === 'all' || sale.date === dateFilter
    const cashierMatches = cashierFilter === 'all' || sale.cashier === cashierFilter
    const statusMatches = statusFilter === 'all' || sale.status === statusFilter
    return searchMatches && dateMatches && cashierMatches && statusMatches
  })

  function handleRequestSubmit() {
    // TODO (MANUAL): Validate the reason and submit a refund/void request to an authorized backend endpoint.
    // The backend must enforce role permissions and the shop's refund/ingredient-return policy.
  }

  function handlePrintReceipt() {
    // TODO (MANUAL): Connect receipt printing or browser print after you implement receipt access.
  }

  function openSaleAction(sale, action) {
    setSelectedSale(null)
    setActionRequest({ sale, action })
  }

  return (
    <CashierLayout>
      <div className="sales-history-heading">
        <div>
          <span className="eyebrow">CASHIER WORKSPACE</span>
          <h1>Sales history</h1>
          <p>Find a demo transaction and preview its items, payment, and receipt details.</p>
        </div>
        <span className="sales-history-count"><ClipboardList size={16} aria-hidden="true" /> {demoSales.length} sample transactions</span>
      </div>

      <div className="demo-data-banner sales-history-banner" role="note">
        <span className="demo-banner-dot" /> Sample transactions only. Search and filters affect this preview and do not query a backend.
      </div>

      <section className="sales-history-card" aria-labelledby="sales-list-title">
        <div className="sales-list-heading">
          <div><h2 id="sales-list-title">Transactions</h2><p>Search by order number or cashier, then narrow the list.</p></div>
          <span className="sales-list-result-count">{visibleSales.length} shown</span>
        </div>

        <div className="sales-filter-bar">
          <label className="sales-search-field">
            <Search size={17} aria-hidden="true" />
            <span className="visually-hidden">Search order number or cashier</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order number or cashier" />
          </label>
          <label className="sales-select-field"><CalendarDays size={15} aria-hidden="true" /><span className="visually-hidden">Filter by date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">All dates</option><option value="2026-10-28">Today · Oct 28</option><option value="2026-10-27">Yesterday · Oct 27</option></select><ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="sales-select-field"><span className="visually-hidden">Filter by cashier</span>
            <select value={cashierFilter} onChange={(event) => setCashierFilter(event.target.value)}><option value="all">All cashiers</option>{demoCashiers.map((cashier) => <option key={cashier} value={cashier}>{cashier}</option>)}</select><ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="sales-select-field"><span className="visually-hidden">Filter by status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="Completed">Completed</option><option value="Voided">Voided</option><option value="Refund requested">Refund requested</option></select><ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>

        <div className="sales-table-scroll">
          <table className="sales-history-table">
            <thead><tr><th>Order number</th><th>Date and time</th><th>Cashier</th><th>Order type</th><th>Payment</th><th>Status</th><th>Total</th><th><span className="visually-hidden">Details</span></th></tr></thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.id}>
                  <td><strong className="sale-order-number">{sale.id}</strong></td><td>{sale.date}<small>{sale.time}</small></td><td>{sale.cashier}</td><td>{sale.orderType}</td><td>{sale.payment}</td>
                  <td><span className={`sale-status status-${sale.status.toLowerCase().replaceAll(' ', '-')}`}>{sale.status}</span></td><td><strong className="sale-row-total">{sale.total}</strong></td>
                  <td><button className="sale-detail-button" type="button" onClick={() => setSelectedSale(sale)} aria-label={`View ${sale.id} details`}><Eye size={16} aria-hidden="true" /><span>View</span></button></td>
                </tr>
              ))}
              {visibleSales.length === 0 && <tr><td className="sales-empty-state" colSpan="8">No sample transactions match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="sales-history-note">Pagination, date ranges, and cashier permissions will be connected when you implement the sales API.</p>
      </section>

      {selectedSale && (
        <SaleDetailDialog sale={selectedSale} onClose={() => setSelectedSale(null)} onRequestAction={openSaleAction} onOpenReceipt={(sale) => { setSelectedSale(null); setReceiptSale(sale) }} />
      )}
      {actionRequest && (
        <SaleActionDialog sale={actionRequest.sale} action={actionRequest.action} onClose={() => setActionRequest(null)} onSubmit={handleRequestSubmit} />
      )}
      {receiptSale && <SaleReceiptDialog sale={receiptSale} onClose={() => setReceiptSale(null)} onPrint={handlePrintReceipt} />}
    </CashierLayout>
  )
}

export default SalesHistoryPage
