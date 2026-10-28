import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDownRight, ArrowUpRight, ClipboardList, Package, Plus, Scale, SlidersHorizontal, Trash2, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoIngredients, demoStockMovements, demoSuppliers, demoUnitGuides } from '../../data/demoInventoryData.js'

function InventoryActionDialog({ actionType, onClose, onSubmit }) {
  const isReceiving = actionType === 'receiving'
  const isWaste = actionType === 'waste'
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { ingredientId: '', quantity: '', supplierId: '', reason: '', note: '' },
  })

  const title = isReceiving ? 'Receive stock' : isWaste ? 'Record waste or spoilage' : 'Adjust stock'

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog inventory-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">INGREDIENT INVENTORY</span>
            <h2 id="inventory-dialog-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close inventory form"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Form preview only. Submitting will not calculate or change stock.</p>

        <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="catalog-form-grid category-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-ingredient">Ingredient or supply</label>
              <select id="inventory-ingredient" aria-invalid={Boolean(errors.ingredientId)} {...register('ingredientId')}>
                <option value="">Choose an item</option>
                {demoIngredients.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.unit})</option>)}
              </select>
              {errors.ingredientId && <span className="field-error" role="alert">{errors.ingredientId.message}</span>}
            </div>
            {isReceiving && (
              <div className="catalog-field field-span-two">
                <label htmlFor="inventory-supplier">Supplier</label>
                <select id="inventory-supplier" {...register('supplierId')}>
                  <option value="">Choose a demo supplier</option>
                  {demoSuppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}
                </select>
              </div>
            )}
            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-quantity">{isReceiving ? 'Quantity received' : isWaste ? 'Quantity wasted' : 'Adjustment quantity'}</label>
              <input id="inventory-quantity" type="number" inputMode="decimal" step="any" placeholder="Enter quantity in the base unit" aria-invalid={Boolean(errors.quantity)} {...register('quantity')} />
              <span className="catalog-field-hint">Use the base unit shown beside the selected ingredient or supply.</span>
              {errors.quantity && <span className="field-error" role="alert">{errors.quantity.message}</span>}
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-reason">Reason</label>
              <select id="inventory-reason" {...register('reason')}>
                <option value="">Choose a reason</option>
                {isReceiving ? (
                  <><option>Supplier delivery</option><option>Other</option></>
                ) : isWaste ? (
                  <><option>Spill</option><option>Spoilage</option><option>Damaged stock</option><option>Other</option></>
                ) : (
                  <><option>Count correction</option><option>Damaged or lost</option><option>Other</option></>
                )}
              </select>
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-note">Note <span className="optional-label">Optional</span></label>
              <textarea id="inventory-note" rows="3" placeholder="Add a note for this stock movement" {...register('note')} />
            </div>
          </div>
          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="catalog-button button-primary" type="submit">{isReceiving ? 'Record receipt' : isWaste ? 'Record waste' : 'Save adjustment'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InventoryPage() {
  const [activeAction, setActiveAction] = useState(null)

  function handleReceiving(formValues) {
    // TODO (MANUAL): Implement supplier receiving and create an auditable stock movement through the backend.
    // Expected input: ingredient/supply ID, base-unit quantity, supplier, reason, and optional note.
    // Expected output: later, record the receipt and update the displayed inventory after the backend responds.
    // Do not convert units or update stock here.
    void formValues
  }

  function handleStockAdjustment(formValues) {
    // TODO (MANUAL): Define adjustment rules and create a reasoned stock movement through the backend.
    // Expected input: ingredient/supply ID, base-unit quantity, reason, and optional note.
    // Expected output: later, update the inventory and movement history after the backend responds.
    // Do not calculate or persist stock changes here.
    void formValues
  }

  function handleWaste(formValues) {
    // TODO (MANUAL): Implement spill, spoilage, and waste recording with an audit reason through the backend.
    // Expected input: ingredient/supply ID, base-unit quantity, waste reason, and optional note.
    // Expected output: later, record the waste movement and refresh the displayed inventory.
    void formValues
  }

  function closeInventoryDialog() {
    setActiveAction(null)
  }

  const selectedHandler = activeAction === 'receiving'
    ? handleReceiving
    : activeAction === 'waste'
      ? handleWaste
      : handleStockAdjustment

  return (
    <AdminLayout>
      <div className="catalog-page-heading inventory-page-heading">
        <div>
          <span className="eyebrow">INGREDIENT AND SUPPLY STOCK</span>
          <h1>Inventory</h1>
          <p>Track coffee ingredients and serving supplies in consistent base units.</p>
        </div>
        <div className="inventory-heading-actions">
          <button className="catalog-button button-quiet" type="button" onClick={() => setActiveAction('adjustment')}>
            <SlidersHorizontal size={15} aria-hidden="true" /> Adjust stock
          </button>
          <button className="catalog-button button-quiet" type="button" onClick={() => setActiveAction('waste')}>
            <Trash2 size={15} aria-hidden="true" /> Record waste
          </button>
          <button className="catalog-button button-primary" type="button" onClick={() => setActiveAction('receiving')}>
            <Plus size={16} aria-hidden="true" /> Receive stock
          </button>
        </div>
      </div>

      <div className="demo-data-banner" role="note">
        <span className="demo-banner-dot" /> Ingredient quantities, thresholds, and stock statuses are fixed demo values. Forms do not change or save data.
      </div>

      <div className="unit-guide-panel" role="note">
        <Scale size={17} aria-hidden="true" />
        <span><strong>Base unit guide</strong>{demoUnitGuides.map((guide) => <small key={guide}>{guide}</small>)}</span>
        <span className="unit-guide-note">Display examples only; conversions are not performed.</span>
      </div>

      <section className="catalog-panel inventory-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Ingredients and supplies</h2>
            <p>On-hand amount and reorder threshold in each item's base unit.</p>
          </div>
          <span className="inventory-demo-label"><ClipboardList size={15} aria-hidden="true" /> DEMO INVENTORY</span>
        </div>
        {/* TODO (MANUAL): Load ingredients, base units, reorder thresholds, and backend-defined statuses. */}
        <div className="catalog-table-scroll">
          <table className="catalog-table inventory-table">
            <thead><tr><th scope="col">Ingredient or supply</th><th scope="col">Code</th><th scope="col">Type</th><th scope="col">On hand</th><th scope="col">Reorder level</th><th scope="col">Status</th><th scope="col">Last movement</th></tr></thead>
            <tbody>
              {demoIngredients.map((item) => (
                <tr key={item.id}>
                  <td><span className="catalog-product-cell"><span className="catalog-product-icon"><Package size={16} aria-hidden="true" /></span><strong>{item.name}</strong></span></td>
                  <td className="catalog-muted-cell">{item.code}</td>
                  <td><span className="inventory-kind-chip">{item.kind}</span></td>
                  <td className="inventory-quantity">{item.quantity} <span>{item.unit}</span></td>
                  <td className="inventory-reorder-level">{item.reorderLevel}</td>
                  <td><span className={`inventory-status ${item.status === 'In stock' ? 'inventory-ok' : item.status === 'Low stock' ? 'inventory-low' : 'inventory-empty'}`}><span />{item.status}</span></td>
                  <td className="catalog-muted-cell">{item.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">Status and reorder values are fixed preview labels; shortage and low-stock rules are not calculated.</p>
      </section>

      <section className="catalog-panel inventory-history-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Stock movement history</h2>
            <p>Example receiving, sale use, adjustment, and waste entries</p>
          </div>
          <span className="history-count-label">{demoStockMovements.length} demo entries</span>
        </div>
        {/* TODO (MANUAL): Fetch the auditable stock-movement ledger from the backend. */}
        <div className="catalog-table-scroll">
          <table className="catalog-table history-table">
            <thead><tr><th scope="col">Reference</th><th scope="col">Ingredient or supply</th><th scope="col">Movement</th><th scope="col">Quantity</th><th scope="col">Reason</th><th scope="col">Supplier</th><th scope="col">Date</th></tr></thead>
            <tbody>
              {demoStockMovements.map((entry) => (
                <tr key={entry.id}>
                  <td className="catalog-muted-cell">{entry.id}</td>
                  <td><span className="history-product-name">{entry.ingredient}<small>{entry.code}</small></span></td>
                  <td><span className={`history-type ${entry.type === 'Receiving' ? 'history-in' : entry.type === 'Sale use' ? 'history-sale-use' : 'history-adjustment'}`}>
                    {entry.type === 'Receiving' ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}{entry.type}
                  </span></td>
                  <td className={`history-quantity ${entry.quantity.startsWith('+') ? 'quantity-positive' : 'quantity-negative'}`}>{entry.quantity} <span>{entry.unit}</span></td>
                  <td>{entry.reason}</td>
                  <td>{entry.supplier}</td>
                  <td className="catalog-muted-cell">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">Movement rows are sample content. Sale consumption is not calculated or connected to checkout.</p>
      </section>

      {activeAction && (
        <InventoryActionDialog
          key={activeAction}
          actionType={activeAction}
          onClose={closeInventoryDialog}
          onSubmit={selectedHandler}
        />
      )}
    </AdminLayout>
  )
}

export default InventoryPage
