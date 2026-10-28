import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CreditCard, FileText, Smartphone, Wallet, X } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'
import { demoCartItems, demoCartOrderType, demoCheckoutFeedback, demoPosTotals, demoReceiptNumber } from '../../data/demoPosData.js'

const paymentMethods = [
  { id: 'cash', label: 'Cash', detail: 'Cash tender preview', icon: Wallet },
  { id: 'card', label: 'Card', detail: 'Record card payment', icon: CreditCard },
  { id: 'ewallet', label: 'E-wallet', detail: 'Record e-wallet payment', icon: Smartphone },
]

function CheckoutConfirmationDialog({ paymentLabel, onClose, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog checkout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-confirm-title">
        <div className="dialog-heading">
          <div>
            <span className="checkout-confirm-icon"><Check size={19} aria-hidden="true" /></span>
            <h2 id="checkout-confirm-title">Review this demo order?</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close checkout confirmation"><X size={18} /></button>
        </div>
        <p className="checkout-confirm-copy">This preview shows the confirmation step. It will not create a sale, record payment, or deduct ingredients.</p>
        <div className="checkout-confirm-summary">
          <span>Order type <strong>{demoCartOrderType}</strong></span>
          <span>Payment method <strong>{paymentLabel}</strong></span>
          <span>Demo total <strong>{demoPosTotals.total}</strong></span>
        </div>
        <div className="dialog-actions">
          <button className="catalog-button button-quiet" type="button" onClick={onClose}>Go back</button>
          <button className="catalog-button button-primary" type="button" onClick={onConfirm}>Confirm preview</button>
        </div>
      </section>
    </div>
  )
}

function ReceiptPreviewDialog({ paymentLabel, onClose, onPrint }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <div className="dialog-heading receipt-dialog-heading">
          <div>
            <span className="eyebrow">SAMPLE RECEIPT</span>
            <h2 id="receipt-title">Receipt preview</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close receipt preview"><X size={18} /></button>
        </div>

        <div className="receipt-paper">
          <div className="receipt-brand">
            <span className="brand-mark"><Wallet size={18} /></span>
            <strong>Bahug Nawung Coffe POS</strong>
            <small>Transaction preview · Not a real sale</small>
          </div>
          <div className="receipt-meta"><span>Receipt</span><strong>{demoReceiptNumber}</strong></div>
          <div className="receipt-meta"><span>Order type</span><strong>{demoCartOrderType}</strong></div>
          <div className="receipt-items">
            {demoCartItems.map((item) => (
              <div className="receipt-item" key={item.id}>
                <div><strong>{item.quantity} × {item.name}</strong><span>{item.variant}</span><span>{item.modifiers}</span></div>
                <b>{item.price}</b>
              </div>
            ))}
          </div>
          <div className="receipt-total"><span>Subtotal · demo</span><strong>{demoPosTotals.subtotal}</strong></div>
          <div className="receipt-total receipt-grand-total"><span>Total · demo</span><strong>{demoPosTotals.total}</strong></div>
          <div className="receipt-meta receipt-payment"><span>Payment method</span><strong>{paymentLabel}</strong></div>
          <p className="receipt-thanks">Thank you · Sample receipt only</p>
        </div>

        <p className="receipt-preview-note">Receipt values are static demo content. Printing is not connected.</p>
        <div className="dialog-actions">
          <button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button>
          <button className="catalog-button button-primary" type="button" onClick={onPrint}><FileText size={15} aria-hidden="true" /> Print preview</button>
        </div>
      </section>
    </div>
  )
}

function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const selectedPayment = paymentMethods.find((method) => method.id === paymentMethod)
  const paymentLabel = selectedPayment?.label || 'Cash'

  function handleConfirmCheckout() {
    // TODO (MANUAL): Implement checkout validation and submit the sale/payment to the backend.
    // Expected input: order type, selected payment method, and any cash tender amount.
    // Expected output: later, atomically record the sale and stock movements or show the backend error.
    // Do not calculate change or trust the displayed demo totals here.
    void cashTendered
    void paymentMethod
  }

  function handlePrintReceipt() {
    // TODO (MANUAL): Implement receipt printing after a real sale is confirmed.
    // This preview must not print as a completed transaction.
  }

  const paymentIcons = { cash: Wallet, card: CreditCard, ewallet: Smartphone }
  const PaymentIcon = paymentIcons[paymentMethod]

  return (
    <CashierLayout>
      <div className="checkout-page-heading">
        <div>
          <span className="eyebrow">ORDER CHECKOUT</span>
          <h1>Review and pay</h1>
          <p>Preview the order summary and payment details before a future checkout step.</p>
        </div>
        <a className="checkout-back-link" href="/cashier"><ArrowLeft size={15} aria-hidden="true" /> Back to menu</a>
      </div>

      <div className="demo-data-banner checkout-demo-banner" role="note">
        <span className="demo-banner-dot" /> This is a checkout preview. No payment gateway, sale record, or ingredient deduction is connected.
      </div>

      <div className="checkout-grid">
        <div className="checkout-main-column">
          <section className="checkout-card" aria-labelledby="checkout-order-title">
            <div className="checkout-section-heading">
              <div>
                <span className="eyebrow">ORDER SUMMARY</span>
                <h2 id="checkout-order-title">Your order</h2>
              </div>
              <span className="checkout-order-type">{demoCartOrderType}</span>
            </div>

            <div className="checkout-item-list">
              {demoCartItems.map((item) => (
                <article className="checkout-item" key={item.id}>
                  <div className="checkout-item-quantity">{item.quantity}</div>
                  <div className="checkout-item-copy">
                    <strong>{item.name}</strong>
                    <span>{item.variant}</span>
                    <small>{item.modifiers}</small>
                  </div>
                  <strong className="checkout-item-price">{item.price}</strong>
                </article>
              ))}
            </div>

            <div className="checkout-summary-totals">
              <div><span>Subtotal <small>Demo</small></span><strong>{demoPosTotals.subtotal}</strong></div>
              <div className="checkout-total-row"><span>Total <small>Demo</small></span><strong>{demoPosTotals.total}</strong></div>
            </div>
            <p className="checkout-policy-note">Discount and tax/fee rows are omitted until the shop rules are decided.</p>
          </section>

          <details className="checkout-feedback-examples">
            <summary><AlertTriangle size={16} aria-hidden="true" /> Example checkout feedback states <span>Demo only</span></summary>
            <div className="checkout-feedback-list">
              {demoCheckoutFeedback.map((feedback) => (
                <article className={`checkout-feedback-card feedback-${feedback.tone}`} key={feedback.id}>
                  <strong>{feedback.title}</strong>
                  <p>{feedback.message}</p>
                  <small>Static UI example · not evaluated for this order</small>
                </article>
              ))}
            </div>
          </details>
        </div>

        <aside className="checkout-payment-card" aria-labelledby="payment-method-title">
          <div className="checkout-section-heading">
            <div>
              <span className="eyebrow">PAYMENT</span>
              <h2 id="payment-method-title">Payment method</h2>
            </div>
            <span className="payment-method-icon"><PaymentIcon size={18} aria-hidden="true" /></span>
          </div>
          <p className="payment-recording-note">Select a method to preview recording it. No card or e-wallet gateway is used.</p>

          <fieldset className="payment-method-list">
            <legend className="visually-hidden">Choose a payment method</legend>
            {paymentMethods.map(({ id, label, detail, icon: Icon }) => (
              <label className={`payment-method-option${paymentMethod === id ? ' is-selected' : ''}`} key={id}>
                <input type="radio" name="payment-method" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} />
                <span className="payment-option-icon"><Icon size={17} aria-hidden="true" /></span>
                <span className="payment-option-copy"><strong>{label}</strong><small>{detail}</small></span>
                <span className="payment-option-check" aria-hidden="true" />
              </label>
            ))}
          </fieldset>

          {paymentMethod === 'cash' && (
            <div className="cash-payment-fields">
              <label htmlFor="cash-tendered">Amount tendered</label>
              <div className="checkout-currency-input"><span>$</span><input id="cash-tendered" type="number" inputMode="decimal" step="0.01" placeholder="Enter amount" value={cashTendered} onChange={(event) => setCashTendered(event.target.value)} /></div>
              <span className="catalog-field-hint">Amount entry preview only.</span>
              <div className="change-display"><span>Change due</span><strong>—</strong><small>Change is not calculated in this preview.</small></div>
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <div className="record-payment-placeholder">
              <Check size={16} aria-hidden="true" />
              <span>Payment method will be recorded manually. No payment details are collected here.</span>
            </div>
          )}

          <button className="checkout-review-button" type="button" onClick={() => setShowConfirmation(true)}>
            Review demo order <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button className="checkout-receipt-link" type="button" onClick={() => setShowReceipt(true)}>
            Preview sample receipt
          </button>
          <p className="checkout-no-submit-note">Review and receipt buttons open UI previews only. Nothing is saved.</p>
        </aside>
      </div>

      {showConfirmation && (
        <CheckoutConfirmationDialog
          paymentLabel={paymentLabel}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmCheckout}
        />
      )}
      {showReceipt && (
        <ReceiptPreviewDialog
          paymentLabel={paymentLabel}
          onClose={() => setShowReceipt(false)}
          onPrint={handlePrintReceipt}
        />
      )}
    </CashierLayout>
  )
}

export default CheckoutPage
