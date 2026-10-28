import { ArrowRight, ClipboardCheck, ShoppingBag } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'

function CashierHomePage() {
  return (
    <CashierLayout>
      <div className="cashier-heading">
        <span className="eyebrow">COUNTER WORKSPACE</span>
        <h1>Ready for the next sale?</h1>
        <p>This is the cashier layout preview. The point-of-sale screen will be added in a later batch.</p>
      </div>

      <section className="cashier-empty-panel" aria-labelledby="cashier-preview-title">
        <span className="cashier-empty-icon"><ShoppingBag size={24} aria-hidden="true" /></span>
        <span className="eyebrow">CASHIER UI PREVIEW</span>
        <h2 id="cashier-preview-title">Your counter space is ready.</h2>
        <p>Product search, cart controls, and checkout are planned for the POS screen batch.</p>
        {/* TODO (MANUAL): Build product search and cart interactions in Batch 6; keep totals and checkout rules under your control. */}
        <a className="cashier-preview-link" href="/login">View cashier sign-in <ArrowRight size={15} aria-hidden="true" /></a>
      </section>

      <div className="cashier-preview-footnote">
        <ClipboardCheck size={16} aria-hidden="true" />
        <span>No sale or cashier session is active in this preview.</span>
      </div>
    </CashierLayout>
  )
}

export default CashierHomePage
