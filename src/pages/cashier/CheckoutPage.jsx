import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CreditCard, FileText, Smartphone, Wallet } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'

const API_URL = 'http://127.0.0.1:8000'
const CART_STORAGE_KEY = 'pos_cart'
const LAST_SALE_KEY = 'pos_last_sale'
const paymentMethods = [
  { id: 'cash', label: 'Cash', detail: 'Record cash received', icon: Wallet },
  { id: 'card', label: 'Card', detail: 'Record manually confirmed card payment', icon: CreditCard },
  { id: 'ewallet', label: 'E-wallet', detail: 'Record manually confirmed e-wallet payment', icon: Smartphone },
]

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}

function readStoredValue(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function hasValidSalePrice(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function readStoredCart() {
  const cart = readStoredValue(CART_STORAGE_KEY, [])
  return Array.isArray(cart)
    ? cart.filter((line) => Number.isInteger(line.variantId) && hasValidSalePrice(line.unitPrice) && Number.isInteger(line.quantity) && line.quantity > 0)
    : []
}

function CheckoutPage() {
  const [cart, setCart] = useState(readStoredCart)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [completedSale, setCompletedSale] = useState(() => readStoredValue(LAST_SALE_KEY, null))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + Number(line.unitPrice) * line.quantity, 0), [cart])
  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethod)
  const changeDue = Number(cashTendered || 0) - subtotal

  useEffect(() => {
    if (completedSale) {
      sessionStorage.setItem(LAST_SALE_KEY, JSON.stringify(completedSale))
    }
  }, [completedSale])

  async function completeSale() {
    setError('')
    if (!cart.length) {
      setError('The order is empty. Return to the menu and add an item first.')
      return
    }
    if (paymentMethod === 'cash' && (!cashTendered || Number(cashTendered) < subtotal)) {
      setError('Enter cash received that covers the total.')
      return
    }

    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setError('Your session has expired. Sign in again.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          cash_tendered: paymentMethod === 'cash' ? cashTendered : null,
          items: cart.map((line) => ({ menu_variant_id: line.variantId, quantity: line.quantity })),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const detail = data?.detail
        const message = Array.isArray(detail) ? detail.map((entry) => entry.msg).join(' ') : detail
        throw new Error(message || `Checkout failed (HTTP ${response.status}).`)
      }
      const sale = await response.json()
      setCompletedSale(sale)
      setCart([])
      sessionStorage.removeItem(CART_STORAGE_KEY)
      setCashTendered('')
    } catch (requestError) {
      setError(requestError.message || 'Could not complete checkout.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startNextSale() {
    setCompletedSale(null)
    sessionStorage.removeItem(LAST_SALE_KEY)
    window.location.assign('/cashier')
  }

  return <CashierLayout>
    <div className="checkout-page-heading"><div><span className="eyebrow">ORDER CHECKOUT</span><h1>{completedSale ? 'Sale completed' : 'Review and pay'}</h1><p>{completedSale ? 'The sale and ingredient use have been recorded.' : 'Confirm the order and record its payment.'}</p></div>{!completedSale && <a className="checkout-back-link" href="/cashier"><ArrowLeft size={15} aria-hidden="true" /> Back to menu</a>}</div>
    <div className="demo-data-banner checkout-demo-banner" role="note"><span className="demo-banner-dot" />Payment is recorded as manually confirmed. No external card or e-wallet processor is connected; discounts and tax remain zero until shop rules are defined.</div>

    {completedSale ? <section className="checkout-card checkout-success-card" aria-labelledby="sale-success-title"><span className="checkout-confirm-icon"><Check size={19} aria-hidden="true" /></span><h2 id="sale-success-title">Sale {completedSale.sale_number}</h2><p>Payment recorded by {completedSale.cashier_name}.</p><div className="receipt-paper"><strong>Bahug Nawung Coffe POS</strong><span>{new Date(completedSale.completed_at).toLocaleString()}</span><span>Sale: {completedSale.sale_number}</span><div className="receipt-items">{completedSale.items.map((item) => <div className="receipt-item" key={item.id}><div><strong>{item.quantity} × {item.item_name}</strong><span>{item.variant_name}</span></div><b>{formatAmount(item.line_total)}</b></div>)}</div><div className="receipt-total"><span>Subtotal</span><strong>{formatAmount(completedSale.subtotal)}</strong></div><div className="receipt-total receipt-grand-total"><span>Total</span><strong>{formatAmount(completedSale.total_amount)}</strong></div><div className="receipt-meta receipt-payment"><span>Payment</span><strong>{completedSale.payment_method}</strong></div></div><div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={() => window.print()}><FileText size={15} /> Print receipt</button><button className="catalog-button button-primary" type="button" onClick={startNextSale}>Start next sale</button><a className="catalog-button button-quiet" href="/cashier/sales">Sales history</a></div></section> : <div className="checkout-grid">
      <section className="checkout-card" aria-labelledby="checkout-order-title"><div className="checkout-section-heading"><div><span className="eyebrow">CURRENT ORDER</span><h2 id="checkout-order-title">Order summary</h2></div><span>{cart.reduce((sum, line) => sum + line.quantity, 0)} items</span></div>
        {cart.length ? <div className="checkout-item-list">{cart.map((item) => <article className="checkout-item" key={item.variantId}><div className="checkout-item-quantity">{item.quantity}</div><div className="checkout-item-copy"><strong>{item.itemName}</strong><span>{item.variantName}</span></div><strong className="checkout-item-price">{formatAmount(Number(item.unitPrice) * item.quantity)}</strong></article>)}</div> : <p className="catalog-table-footnote">No items in the order. <a href="/cashier">Return to the menu.</a></p>}
        <div className="checkout-summary-totals"><div><span>Subtotal</span><strong>{formatAmount(subtotal)}</strong></div><div className="checkout-total-row"><span>Total</span><strong>{formatAmount(subtotal)}</strong></div></div>
      </section>
      <aside className="checkout-payment-card" aria-labelledby="payment-method-title"><div className="checkout-section-heading"><div><span className="eyebrow">PAYMENT</span><h2 id="payment-method-title">Payment method</h2></div></div><div className="payment-method-list">{paymentMethods.map((method) => { const Icon = method.icon; return <label className={`payment-method-option${paymentMethod === method.id ? ' is-selected' : ''}`} key={method.id}><input type="radio" name="payment-method" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} /><span className="payment-option-icon"><Icon size={17} aria-hidden="true" /></span><span className="payment-option-copy"><strong>{method.label}</strong><small>{method.detail}</small></span><span className="payment-option-check" /></label> })}</div>
        {paymentMethod === 'cash' && <div className="cash-payment-fields"><label htmlFor="cash-tendered">Cash received</label><div className="checkout-currency-input"><input id="cash-tendered" type="number" min={subtotal} step="0.01" inputMode="decimal" placeholder="0.00" value={cashTendered} onChange={(event) => setCashTendered(event.target.value)} /></div><div className="change-display"><span>Change due</span><strong>{formatAmount(Math.max(0, changeDue))}</strong></div></div>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="checkout-review-button" type="button" disabled={!cart.length || isSubmitting} onClick={completeSale}>{isSubmitting ? 'Recording sale...' : `Complete sale · ${formatAmount(subtotal)}`}</button><p className="checkout-no-submit-note">{selectedPayment?.label} is recorded when you complete this sale.</p>
      </aside>
    </div>}
  </CashierLayout>
}

export default CheckoutPage
