import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import CashierLayout from '../../layouts/CashierLayout.jsx'

const API_URL = 'http://127.0.0.1:8000'
const CART_STORAGE_KEY = 'pos_cart'

function hasValidSalePrice(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function readSavedCart() {
  try {
    const savedCart = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) || '[]')
    return Array.isArray(savedCart)
      ? savedCart
        .filter((line) => line && Number.isInteger(Number(line.variantId ?? line.variant_id ?? line.menu_variant_id)) && Number.isInteger(Number(line.quantity)) && Number(line.quantity) > 0)
        .map((line) => ({
          ...line,
          variantId: Number(line.variantId ?? line.variant_id ?? line.menu_variant_id),
          itemName: line.itemName ?? line.item_name ?? 'Menu item',
          variantName: line.variantName ?? line.variant_name ?? '',
          unitPrice: hasValidSalePrice(line.unitPrice) ? Number(line.unitPrice) : null,
          quantity: Number(line.quantity),
        }))
      : []
  } catch {
    return []
  }
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}

function formatQuantity(value) {
  const quantity = Number(value)
  return Number.isFinite(quantity) ? quantity.toFixed(6).replace(/\.?0+$/, '') : String(value)
}

function getCartStockShortages(cart, menuItems) {
  const variantsById = new Map(menuItems.flatMap((item) => item.variants.map((variant) => [variant.id, variant])))
  const ingredientTotals = new Map()

  for (const line of cart) {
    const variant = variantsById.get(Number(line.variantId))
    if (!variant) continue
    for (const requirement of variant.stock_requirements ?? []) {
      const total = ingredientTotals.get(requirement.ingredient_id) ?? {
        name: requirement.ingredient_name,
        unit: requirement.base_unit,
        required: 0,
        available: Number(requirement.current_quantity),
        isActive: requirement.is_active,
      }
      total.required += Number(requirement.quantity_per_serving) * Number(line.quantity)
      total.available = Math.min(total.available, Number(requirement.current_quantity))
      total.isActive = total.isActive && requirement.is_active
      ingredientTotals.set(requirement.ingredient_id, total)
    }
  }

  return [...ingredientTotals.values()]
    .filter((ingredient) => !ingredient.isActive || ingredient.required > ingredient.available + 1e-9)
    .map((ingredient) => !ingredient.isActive
      ? `${ingredient.name} is inactive`
      : `Not enough ${ingredient.name}: need ${formatQuantity(ingredient.required)} ${ingredient.unit}, have ${formatQuantity(ingredient.available)} ${ingredient.unit}`)
}

function getVariantStockShortages(variant, cart, menuItems) {
  return getCartStockShortages([...cart, { variantId: variant.id, quantity: 1 }], menuItems)
}

function resolveCartVariant(line, menuItems) {
  const allVariants = menuItems.flatMap((item) => item.variants.map((variant) => ({ ...variant, menuItemName: item.name })))
  const idMatch = allVariants.find((variant) => String(variant.id) === String(line.variantId))
  if (idMatch?.has_recipe && hasValidSalePrice(idMatch.price)) return idMatch

  const normalizedItemName = String(line.itemName ?? '').trim().toLowerCase()
  const itemMatches = menuItems.filter((item) => String(item.name ?? '').trim().toLowerCase() === normalizedItemName)
  const candidates = itemMatches.flatMap((item) => item.variants
    .filter((variant) => variant.has_recipe && hasValidSalePrice(variant.price))
    .map((variant) => ({ ...variant, menuItemName: item.name })))
  const normalizedVariantName = String(line.variantName ?? '').trim().toLowerCase()
  if (normalizedVariantName) {
    const namedMatch = candidates.find((variant) => String(variant.variant_name ?? '').trim().toLowerCase() === normalizedVariantName)
    if (namedMatch) return namedMatch
  }
  return candidates.length === 1 ? candidates[0] : null
}

function MenuOptionsDialog({ menuItem, menuItems, cart, onClose, onAdd }) {
  const firstAvailableVariant = menuItem.variants.find((variant) =>
    variant.has_recipe && hasValidSalePrice(variant.price) && getVariantStockShortages(variant, cart, menuItems).length === 0,
  )
  const configuredVariants = menuItem.variants.filter((variant) => variant.has_recipe && hasValidSalePrice(variant.price))
  const [selectedVariantId, setSelectedVariantId] = useState(String(firstAvailableVariant?.id ?? ''))
  const [error, setError] = useState('')
  const selectedVariant = menuItem.variants.find((variant) => variant.id === Number(selectedVariantId))
  const selectedVariantAvailable = Boolean(selectedVariant?.has_recipe
    && hasValidSalePrice(selectedVariant.price)
    && getVariantStockShortages(selectedVariant, cart, menuItems).length === 0)

  function submitSelection(event) {
    event.preventDefault()
    const variant = menuItem.variants.find((item) => item.id === Number(selectedVariantId))
    if (!variant?.has_recipe || !hasValidSalePrice(variant.price)) {
      setError('Choose a variant with a saved recipe and sale price.')
      return
    }
    const shortages = getVariantStockShortages(variant, cart, menuItems)
    if (shortages.length) {
      setError(shortages.join('. '))
      return
    }
    onAdd(variant)
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="catalog-dialog pos-options-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-options-title">
      <div className="dialog-heading"><div><span className="eyebrow">MENU OPTIONS</span><h2 id="menu-options-title">{menuItem.name}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close menu options"><X size={18} /></button></div>
      <p className="dialog-preview-note">Select the size or variant to add to the current order.</p>
      <form className="pos-options-form" onSubmit={submitSelection}>
        <fieldset className="pos-choice-group"><legend>Size or variant</legend><div className="variant-choice-list">{menuItem.variants.map((variant) => {
          const configured = variant.has_recipe && hasValidSalePrice(variant.price)
          const stockShortages = configured ? getVariantStockShortages(variant, cart, menuItems) : []
          const available = configured && stockShortages.length === 0
          const unavailableReason = !variant.has_recipe ? 'Recipe required' : !hasValidSalePrice(variant.price) ? 'Sale price required' : stockShortages.join('; ')
          return <label className={`variant-choice${available ? '' : ' is-unavailable'}`} key={variant.id}>
            <input type="radio" name="menu-variant" value={variant.id} disabled={!available} checked={selectedVariantId === String(variant.id)} onChange={(event) => { setSelectedVariantId(event.target.value); setError('') }} />
            <span>{variant.variant_name}{!available && <small>{unavailableReason}</small>}</span>
            <strong>{formatAmount(variant.price)}</strong>
          </label>
        })}</div></fieldset>
        {!configuredVariants.length && <p className="field-error" role="status">This item needs a saved recipe and sale price before it can be sold.</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="catalog-button button-primary" type="submit" disabled={!selectedVariantAvailable}>Add to order</button></div>
      </form>
    </section>
  </div>
}

function PosPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState(readSavedCart)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [categoryId, setCategoryId] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true
    sessionStorage.removeItem('pos_last_sale')
    async function loadMenu() {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        setLoadError('Sign in with a Cashier account to load the menu.')
        setIsLoading(false)
        return
      }
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [menuResponse, categoryResponse] = await Promise.all([
          fetch(`${API_URL}/cashier/menu`, { headers }),
          fetch(`${API_URL}/menu/categories`, { headers }),
        ])
        const failed = [menuResponse, categoryResponse].find((response) => !response.ok)
        if (failed) throw new Error(`Could not load the cashier menu (HTTP ${failed.status}).`)
        const [menuData, categoryData] = await Promise.all([menuResponse.json(), categoryResponse.json()])
        if (isMounted) {
          setMenuItems(menuData.filter((item) => item.variants.length > 0))
          setCategories(categoryData)
          // Refresh stored cart prices from the API so an old or stale session cart uses current sale prices.
          setCart((current) => current.flatMap((line) => {
            const currentVariant = resolveCartVariant(line, menuData)
            if (!currentVariant) return []
            return [{
              ...line,
              variantId: currentVariant.id,
              itemName: currentVariant.menuItemName,
              variantName: currentVariant.variant_name,
              unitPrice: Number(currentVariant.price),
            }]
          }))
          setLoadError('')
        }
      } catch (error) {
        if (isMounted) setLoadError(error.message || 'Could not load the menu.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadMenu()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const matchesSearch = `${item.name} ${item.description || ''}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesSearch && (categoryId === 'all' || String(item.category_id) === categoryId)
  }), [menuItems, search, categoryId])

  const pricedCart = cart.map((line) => {
    const currentVariant = resolveCartVariant(line, menuItems)
    return currentVariant ? {
      ...line,
      variantId: currentVariant.id,
      itemName: currentVariant.menuItemName,
      variantName: currentVariant.variant_name,
      unitPrice: Number(currentVariant.price),
    } : { ...line, unitPrice: null }
  })
  const hasUnpricedCartLines = pricedCart.some((line) => !hasValidSalePrice(line.unitPrice))
  const subtotal = pricedCart.reduce((sum, line) => sum + (hasValidSalePrice(line.unitPrice) ? Number(line.unitPrice) : 0) * line.quantity, 0)
  const cartStockShortages = getCartStockShortages(cart, menuItems)

  function canAddVariant(variant) {
    return variant.has_recipe
      && hasValidSalePrice(variant.price)
      && getVariantStockShortages(variant, cart, menuItems).length === 0
  }

  function canIncreaseCartLine(variantId) {
    const nextCart = cart.map((line) => line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line)
    return getCartStockShortages(nextCart, menuItems).length === 0
  }

  function addToCart(menuItem, variant) {
    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant.id)
      const nextCart = existing
        ? current.map((line) => line.variantId === variant.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { variantId: variant.id, itemName: menuItem.name, variantName: variant.variant_name, unitPrice: Number(variant.price), quantity: 1 }]
      return getCartStockShortages(nextCart, menuItems).length ? current : nextCart
    })
    setSelectedMenuItem(null)
  }

  function changeQuantity(variantId, amount) {
    setCart((current) => {
      const nextCart = current.map((line) => line.variantId === variantId ? { ...line, quantity: line.quantity + amount } : line).filter((line) => line.quantity > 0)
      return amount > 0 && getCartStockShortages(nextCart, menuItems).length ? current : nextCart
    })
  }

  function removeLine(variantId) {
    setCart((current) => current.filter((line) => line.variantId !== variantId))
  }

  function continueToCheckout() {
    window.history.pushState({}, '', '/cashier/checkout')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return <CashierLayout>
    <div className="pos-page-heading"><div><span className="eyebrow">COFFEE SHOP REGISTER</span><h1>Point of sale</h1><p>Choose menu items and build the current order.</p></div><span className="pos-session-label"><span />{isLoading ? 'Loading menu...' : 'Cashier register'}</span></div>
    <div className="demo-data-banner pos-demo-banner" role="note"><span className="demo-banner-dot" /> Menu options reflect current ingredient stock. Checkout checks stock again before recording a sale; discounts and tax remain disabled until shop rules are set.</div>
    {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
    <div className="pos-workspace-grid">
      <section className="pos-catalog-panel" aria-labelledby="pos-catalog-title">
        <div className="pos-catalog-heading"><div><h2 id="pos-catalog-title">Coffee shop menu</h2><p>{isLoading ? 'Loading menu...' : `${menuItems.length} menu items`}</p></div><span className="pos-catalog-icon"><ShoppingBag size={17} aria-hidden="true" /></span></div>
        <label className="pos-search-field" htmlFor="pos-menu-search"><Search size={17} aria-hidden="true" /><input id="pos-menu-search" type="search" placeholder="Search drinks and food" value={search} onChange={(event) => setSearch(event.target.value)} /><span className="search-shortcut">Search</span></label>
        <div className="pos-category-heading"><span>Menu categories</span></div>
        <div className="pos-category-list" aria-label="Filter menu by category"><button className={`pos-category-chip${categoryId === 'all' ? ' is-selected' : ''}`} type="button" onClick={() => setCategoryId('all')}>All items</button>{categories.map((category) => <button className={`pos-category-chip${categoryId === String(category.id) ? ' is-selected' : ''}`} type="button" key={category.id} onClick={() => setCategoryId(String(category.id))}>{category.name}</button>)}</div>
        {isLoading ? <p className="catalog-table-footnote">Loading available menu items...</p> : visibleItems.length === 0 ? <p className="catalog-table-footnote">No menu items match this search and category.</p> : <div className="pos-product-grid">{visibleItems.map((item) => {
          const configured = item.variants.filter((variant) => variant.has_recipe && hasValidSalePrice(variant.price))
          const available = configured.filter(canAddVariant)
          const hasRecipe = item.variants.some((variant) => variant.has_recipe)
          const cheapest = configured.length ? Math.min(...configured.map((variant) => Number(variant.price))) : null
          const status = available.length ? 'Available' : configured.length ? 'Out of stock' : hasRecipe ? 'Sale price needed' : 'Recipe needed'
          const cardNote = configured.length && !available.length
            ? 'No variant has enough ingredient stock. Open options to see what is missing.'
            : !configured.length ? hasRecipe ? 'Enter a valid sale price in admin.' : 'Add an effective recipe before selling.' : ''
          return <article className={`pos-product-card${available.length ? '' : ' has-availability-warning'}`} key={item.id}><div className="pos-product-card-top"><span className="pos-product-symbol"><ShoppingBag size={20} aria-hidden="true" /></span><span className={`pos-product-status${available.length ? '' : ' is-inactive'}`}>{status}</span></div><h3>{item.name}</h3><span className="pos-product-sku">{categories.find((category) => category.id === item.category_id)?.name || 'Menu item'}</span><div className="pos-product-card-bottom"><span className="pos-product-price">{cheapest === null ? 'No sellable variant' : `From ${formatAmount(cheapest)}`}</span><button className="pos-add-button" type="button" onClick={() => setSelectedMenuItem(item)} disabled={!configured.length} aria-label={`${configured.length ? 'Choose options for' : 'Unavailable:'} ${item.name}`}><Plus size={16} aria-hidden="true" /></button></div>{cardNote && <span className="pos-shortage-note"><AlertTriangle size={13} aria-hidden="true" />{cardNote}</span>}</article>
        })}</div>}
      </section>
      <aside className="pos-cart-panel" aria-labelledby="pos-cart-title">
        <div className="pos-cart-heading"><div><span className="eyebrow">CURRENT ORDER</span><h2 id="pos-cart-title">Cart <span>{cart.reduce((sum, line) => sum + line.quantity, 0)}</span></h2></div><span className="cart-bag-icon"><ShoppingBag size={18} aria-hidden="true" /></span></div>
        {cart.length === 0 ? <p className="pos-cart-notice">Your order is empty. Select a menu item to begin.</p> : <div className="pos-cart-lines">{pricedCart.map((line) => <article className="pos-cart-line" key={line.variantId}><div className="cart-line-main"><span className="cart-line-icon"><ShoppingBag size={16} aria-hidden="true" /></span><div className="cart-line-copy"><strong>{line.itemName}</strong><span>{line.variantName}</span></div><button className="cart-remove-button" type="button" onClick={() => removeLine(line.variantId)} aria-label={`Remove ${line.itemName} ${line.variantName}`}><Trash2 size={15} aria-hidden="true" /></button></div><div className="cart-line-bottom"><span className="cart-line-price">{isLoading ? 'Updating price...' : hasValidSalePrice(line.unitPrice) ? `${formatAmount(line.unitPrice)} each` : 'Price unavailable'}</span><div className="cart-quantity-control" aria-label={`${line.itemName} quantity controls`}><button type="button" onClick={() => changeQuantity(line.variantId, -1)} aria-label={`Decrease ${line.itemName} quantity`}><Minus size={13} /></button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.variantId, 1)} disabled={!canIncreaseCartLine(line.variantId)} aria-label={`Increase ${line.itemName} quantity`}><Plus size={13} /></button></div></div><strong className="cart-line-subtotal">{isLoading ? '...' : hasValidSalePrice(line.unitPrice) ? formatAmount(Number(line.unitPrice) * line.quantity) : '—'}</strong></article>)}</div>}
        <div className="pos-totals"><div><span>Subtotal</span><strong>{isLoading || hasUnpricedCartLines ? '—' : formatAmount(subtotal)}</strong></div><div className="pos-total-row"><span>Total</span><strong>{isLoading || hasUnpricedCartLines ? '—' : formatAmount(subtotal)}</strong></div></div>
        {cartStockShortages.length > 0 && <p className="field-error" role="alert">{cartStockShortages.join('. ')}</p>}
        <p className="pos-policy-note">No discount or tax is applied.</p>
        <button className="pos-checkout-button" type="button" disabled={!cart.length || isLoading || Boolean(loadError) || hasUnpricedCartLines || cartStockShortages.length > 0} onClick={continueToCheckout}>Continue to checkout <ArrowRight size={17} aria-hidden="true" /></button>
      </aside>
    </div>
    {selectedMenuItem && <MenuOptionsDialog key={selectedMenuItem.id} menuItem={selectedMenuItem} menuItems={menuItems} cart={cart} onClose={() => setSelectedMenuItem(null)} onAdd={(variant) => addToCart(selectedMenuItem, variant)} />}
  </CashierLayout>
}

export default PosPage
