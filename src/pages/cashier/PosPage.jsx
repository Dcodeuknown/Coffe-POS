import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertTriangle, ArrowRight, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, X } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'
import { demoMenuCategories, demoMenuItems } from '../../data/demoCatalogData.js'
import { demoCartItems, demoCartOrderType, demoPosTotals } from '../../data/demoPosData.js'

function MenuOptionsDialog({ menuItem, onClose, onAdd }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { variant: menuItem.variants[0]?.name || '', modifiers: [] },
  })

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog pos-options-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-options-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MENU OPTIONS PREVIEW</span>
            <h2 id="menu-options-title">{menuItem.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close menu options"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Choose options to preview the form. Nothing will be added to the demo cart.</p>

        <form className="pos-options-form" onSubmit={handleSubmit(onAdd)} noValidate>
          <fieldset className="pos-choice-group">
            <legend>Size or variant</legend>
            <div className="variant-choice-list">
              {menuItem.variants.map((variant) => (
                <label className="variant-choice" key={variant.name}>
                  <input type="radio" value={variant.name} {...register('variant')} />
                  <span>{variant.name}</span>
                  <strong>{variant.price}</strong>
                </label>
              ))}
            </div>
          </fieldset>

          {menuItem.modifierGroups.length > 0 && (
            <div className="pos-modifier-groups">
              {menuItem.modifierGroups.map((group) => (
                <fieldset className="pos-choice-group modifier-choice-group" key={group.name}>
                  <legend>{group.name}</legend>
                  <div className="modifier-choice-list">
                    {group.options.map((option) => (
                      <label className="modifier-choice" key={option}>
                        <input type="checkbox" value={`${group.name}: ${option}`} {...register('modifiers')} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          <p className="pos-options-warning">Selection rules are illustrative. Modifier prices, ingredient substitutions, and recipe changes are not applied.</p>
          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="catalog-button button-primary" type="submit">Add to cart preview</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function PosPage() {
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [orderType, setOrderType] = useState(demoCartOrderType)

  function handleAddToCart(menuItem, selectedOptions) {
    // TODO (MANUAL): Implement cart addition with the selected variant and modifiers.
    // Expected input: menu-item ID, chosen variant, and modifier selections.
    // Expected output: later, add a cart line while respecting ingredient availability and stock rules.
    // This preview does not change the cart or calculate a price.
    void menuItem
    void selectedOptions
  }

  function handleIncreaseQuantity(item) {
    // TODO (MANUAL): Implement quantity increases and ingredient availability checks.
    // Expected input: selected sale-line ID.
    // Expected output: later, update the cart and refresh the authoritative display values.
    void item
  }

  function handleDecreaseQuantity(item) {
    // TODO (MANUAL): Implement quantity decreases and zero-quantity behavior yourself.
    // Expected input: selected sale-line ID.
    // Expected output: later, update or remove the cart line and refresh display values.
    void item
  }

  function handleRemoveItem(item) {
    // TODO (MANUAL): Implement sale-line removal and refresh display values.
    // Expected input: selected sale-line ID.
    // Expected output: later, remove the line from cart state.
    void item
  }

  function handleAddSelection(menuItem, selection) {
    handleAddToCart(menuItem, selection)
  }

  const unavailablePreview = (menuItem) => menuItem.availabilityPreview !== 'Available demo'

  return (
    <CashierLayout>
      <div className="pos-page-heading">
        <div>
          <span className="eyebrow">COFFEE SHOP REGISTER</span>
          <h1>Point of sale</h1>
          <p>Browse drinks and food, then preview sizes and modifiers.</p>
        </div>
        <span className="pos-session-label"><span />UI preview · No active sale</span>
      </div>

      <div className="demo-data-banner pos-demo-banner" role="note">
        <span className="demo-banner-dot" /> Menu, ingredient availability, cart lines, and totals are demo content. No sale can be submitted.
      </div>

      <div className="pos-workspace-grid">
        <section className="pos-catalog-panel" aria-labelledby="pos-catalog-title">
          <div className="pos-catalog-heading">
            <div>
              <h2 id="pos-catalog-title">Coffee shop menu</h2>
              <p>{demoMenuItems.length} demo menu items</p>
            </div>
            <span className="pos-catalog-icon"><ShoppingBag size={17} aria-hidden="true" /></span>
          </div>

          <label className="pos-search-field" htmlFor="pos-menu-search">
            <Search size={17} aria-hidden="true" />
            <input id="pos-menu-search" type="search" placeholder="Search drinks and food" disabled />
            <span className="search-shortcut">Preview</span>
          </label>

          <div className="pos-category-heading">
            <span>Menu categories</span>
            <SlidersHorizontal size={15} aria-hidden="true" />
          </div>
          <div className="pos-category-list" aria-label="Menu category filter preview">
            <button className="pos-category-chip is-selected" type="button" disabled>All items</button>
            {demoMenuCategories.map((category) => (
              <button className="pos-category-chip" type="button" disabled key={category.id}>{category.name}</button>
            ))}
          </div>

          {/* TODO (MANUAL): Load menu data and implement search/category selection after you build the API integration. */}
          <div className="pos-product-grid">
            {demoMenuItems.map((menuItem) => {
              const isUnavailable = unavailablePreview(menuItem)
              const isShortagePreview = menuItem.availabilityPreview === 'Shortage preview'

              return (
                <article className={`pos-product-card${isUnavailable ? ' has-availability-warning' : ''}`} key={menuItem.id}>
                  <div className="pos-product-card-top">
                    <span className="pos-product-symbol"><ShoppingBag size={20} aria-hidden="true" /></span>
                    <span className={`pos-product-status${isUnavailable ? ' is-inactive' : ''}`}>
                      {isShortagePreview ? 'Ingredient risk · Demo' : menuItem.availabilityPreview}
                    </span>
                  </div>
                  <h3>{menuItem.name}</h3>
                  <span className="pos-product-sku">{menuItem.category} · {menuItem.variantSummary}</span>
                  <div className="pos-product-card-bottom">
                    <span className="pos-product-price">From {menuItem.price}</span>
                    <button
                      className="pos-add-button"
                      type="button"
                      onClick={() => setSelectedMenuItem(menuItem)}
                      disabled={isUnavailable}
                      aria-label={isUnavailable ? `${menuItem.name} unavailable in the demo preview` : `Choose options for ${menuItem.name}`}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {isShortagePreview && <span className="pos-shortage-note"><AlertTriangle size={13} aria-hidden="true" />Milk shortage example; status is fixed demo content.</span>}
                </article>
              )
            })}
          </div>
          <p className="pos-controls-note">Search and category controls are visual placeholders. Availability is not calculated.</p>
        </section>

        <aside className="pos-cart-panel" aria-labelledby="pos-cart-title">
          <div className="pos-cart-heading">
            <div>
              <span className="eyebrow">CURRENT ORDER</span>
              <h2 id="pos-cart-title">Cart <span>DEMO</span></h2>
            </div>
            <span className="cart-bag-icon"><ShoppingBag size={18} aria-hidden="true" /></span>
          </div>

          <div className="pos-cart-notice">Sample cart only. Quantity and remove controls do not change these lines.</div>

          <fieldset className="order-type-selector">
            <legend>Order type</legend>
            <label className={orderType === 'Takeaway' ? 'is-selected' : ''}>
              <input type="radio" name="order-type" value="Takeaway" checked={orderType === 'Takeaway'} onChange={() => setOrderType('Takeaway')} />
              <span>Takeaway</span>
            </label>
            <label className={orderType === 'Dine-in' ? 'is-selected' : ''}>
              <input type="radio" name="order-type" value="Dine-in" checked={orderType === 'Dine-in'} onChange={() => setOrderType('Dine-in')} />
              <span>Dine-in</span>
            </label>
          </fieldset>
          <p className="order-type-note">Order type selection is UI-only and is not attached to the demo sale.</p>

          <div className="pos-cart-lines">
            {demoCartItems.map((item) => (
              <article className="pos-cart-line" key={item.id}>
                <div className="cart-line-main">
                  <span className="cart-line-icon"><ShoppingBag size={16} aria-hidden="true" /></span>
                  <div className="cart-line-copy">
                    <strong>{item.name}</strong>
                    <span>{item.variant} · {item.modifiers}</span>
                  </div>
                  <button className="cart-remove-button" type="button" onClick={() => handleRemoveItem(item)} aria-label={`Remove ${item.name} (not connected)`}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="cart-line-bottom">
                  <span className="cart-line-price">{item.price} each</span>
                  <div className="cart-quantity-control" aria-label={`${item.name} quantity controls`}>
                    <button type="button" onClick={() => handleDecreaseQuantity(item)} aria-label={`Decrease ${item.name} quantity`}><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => handleIncreaseQuantity(item)} aria-label={`Increase ${item.name} quantity`}><Plus size={13} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="pos-totals">
            <div><span>Subtotal <small>Demo</small></span><strong>{demoPosTotals.subtotal}</strong></div>
            <div className="pos-total-row"><span>Total <small>Demo</small></span><strong>{demoPosTotals.total}</strong></div>
          </div>
          <p className="pos-policy-note">Discount and tax/fee rows are omitted until the shop rules are decided.</p>

          <a className="pos-checkout-button" href="/cashier/checkout">
            Checkout <ArrowRight size={17} aria-hidden="true" />
          </a>
          <p className="pos-checkout-note">Open checkout preview. No sale, payment, or ingredient deduction will occur.</p>
        </aside>
      </div>

      {selectedMenuItem && (
        <MenuOptionsDialog
          key={selectedMenuItem.id}
          menuItem={selectedMenuItem}
          onClose={() => setSelectedMenuItem(null)}
          onAdd={(selection) => handleAddSelection(selectedMenuItem, selection)}
        />
      )}
    </CashierLayout>
  )
}

export default PosPage
