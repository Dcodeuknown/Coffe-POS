import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BadgeCheck, ChevronDown, CirclePlus, Coffee, MoreHorizontal, Pencil, Search, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoMenuCategories, demoMenuItems } from '../../data/demoCatalogData.js'

function MenuItemFormDialog({ menuItem, onClose, onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: menuItem ? {
      name: menuItem.name,
      description: menuItem.description,
      sku: menuItem.sku,
      category: menuItem.category,
      price: menuItem.price.replace('$', ''),
      availability: menuItem.status,
      variants: menuItem.variantDetails,
      modifiers: menuItem.modifierSummary,
    } : {
      name: '', description: '', sku: '', category: '', price: '', availability: 'Available', variants: '', modifiers: '',
    },
  })

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog menu-item-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MENU ITEM</span>
            <h2 id="menu-dialog-title">{menuItem ? 'Edit menu item' : 'Add menu item'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close menu item form"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Preview form only. Submitting will not save or change menu data.</p>

        <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="catalog-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-name">Menu item name</label>
              <input id="menu-name" placeholder="e.g. Vanilla latte" aria-invalid={Boolean(errors.name)} {...register('name')} />
              {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-description">Description</label>
              <textarea id="menu-description" rows="2" placeholder="Short description for the cashier menu" {...register('description')} />
            </div>
            <div className="catalog-field">
              <label htmlFor="menu-code">Menu code <span className="optional-label">Optional</span></label>
              <input id="menu-code" placeholder="e.g. COF-101" {...register('sku')} />
            </div>
            <div className="catalog-field">
              <label htmlFor="menu-category">Category</label>
              <select id="menu-category" {...register('category')}>
                <option value="">Choose a category</option>
                {demoMenuCategories.map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="catalog-field">
              <label htmlFor="menu-price">Starting price</label>
              <div className="input-with-prefix"><span>$</span><input id="menu-price" type="number" inputMode="decimal" step="0.01" placeholder="0.00" {...register('price')} /></div>
            </div>
            <div className="catalog-field">
              <label htmlFor="menu-availability">Availability</label>
              <select id="menu-availability" {...register('availability')}>
                <option>Available</option>
                <option>Unavailable</option>
              </select>
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-variants">Sizes and variants</label>
              <textarea id="menu-variants" rows="3" placeholder={'One option per line, for example:\nSmall — $3.75\nMedium — $4.25'} {...register('variants')} />
              <span className="catalog-field-hint">Display-only examples. Variant prices and recipes are not applied.</span>
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-modifiers">Modifier groups and options</label>
              <textarea id="menu-modifiers" rows="3" placeholder={'For example:\nMilk choice: whole, oat, almond\nSweetness: regular, less sweet'} {...register('modifiers')} />
              <span className="catalog-field-hint">Substitutions and extra ingredients are not calculated.</span>
            </div>
          </div>

          <div className="recipe-link-placeholder">
            <Coffee size={17} aria-hidden="true" />
            <span><strong>Recipe association</strong><small>Recipe setup UI is planned for a later batch.</small></span>
            <span className="recipe-placeholder-status"><BadgeCheck size={14} />Placeholder</span>
          </div>

          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="catalog-button button-primary" type="submit">{menuItem ? 'Save preview' : 'Add menu item'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState(null)

  function openNewMenuItemForm() {
    setActiveMenuItem(null)
    setIsFormOpen(true)
  }

  function openEditMenuItemForm(menuItem) {
    setActiveMenuItem(menuItem)
    setIsFormOpen(true)
  }

  function closeMenuItemForm() {
    setIsFormOpen(false)
    setActiveMenuItem(null)
  }

  function handleCreateMenuItem(formValues) {
    // TODO (MANUAL): Implement menu-item creation and connect the form to the menu API.
    // Expected input: menu name, description, category, price, availability, variants, and modifiers.
    // Expected output: later, create the menu item through the backend and handle its response.
    void formValues
  }

  function handleUpdateMenuItem(formValues) {
    // TODO (MANUAL): Implement menu-item updates and connect the form to the menu API.
    // Expected input: edited menu fields and the selected menu-item ID.
    // Expected output: later, update the backend record and handle success or error states.
    void formValues
  }

  function handleMarkUnavailable(menuItem) {
    // TODO (MANUAL): Implement availability changes using the menu API and shop rules.
    // Expected input: the selected menu-item ID and requested availability state.
    // Expected output: later, update the backend and refresh the displayed menu.
    void menuItem
  }

  return (
    <AdminLayout>
      <div className="catalog-page-heading">
        <div>
          <span className="eyebrow">COFFEE SHOP MENU</span>
          <h1>Menu items</h1>
          <p>Manage the menu presentation, options, and availability.</p>
        </div>
        <button className="catalog-button button-primary" type="button" onClick={openNewMenuItemForm}>
          <CirclePlus size={16} aria-hidden="true" /> Add menu item
        </button>
      </div>

      <div className="demo-data-banner" role="note">
        <span className="demo-banner-dot" /> Demo menu only. Ingredients and stock are managed separately; forms and controls do not save data.
      </div>

      <section className="catalog-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Menu</h2>
            <p>{demoMenuItems.length} demo menu items</p>
          </div>
          <a className="catalog-switch-link" href="/admin/categories"><Coffee size={15} aria-hidden="true" /> Manage menu categories</a>
        </div>

        <div className="catalog-toolbar">
          <label className="catalog-search" htmlFor="menu-search">
            <Search size={16} aria-hidden="true" />
            <input id="menu-search" type="search" placeholder="Search menu items" disabled />
          </label>
          <label className="catalog-select-wrap" htmlFor="menu-category-filter">
            <select id="menu-category-filter" defaultValue="all" disabled>
              <option value="all">All categories</option>
              {demoMenuCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="catalog-select-wrap" htmlFor="menu-availability-filter">
            <select id="menu-availability-filter" defaultValue="all" disabled>
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <span className="toolbar-preview-label">Filters shown as preview</span>
        </div>

        <div className="catalog-table-scroll">
          <table className="catalog-table menu-table">
            <thead><tr><th scope="col">Menu item</th><th scope="col">Category</th><th scope="col">Variants</th><th scope="col">Modifiers</th><th scope="col">Starting price</th><th scope="col">Availability</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {demoMenuItems.map((menuItem) => (
                <tr key={menuItem.id}>
                  <td><span className="catalog-product-cell"><span className="catalog-product-icon"><Coffee size={16} aria-hidden="true" /></span><span className="menu-item-cell"><strong>{menuItem.name}</strong><small>{menuItem.sku} · {menuItem.description}</small></span></span></td>
                  <td>{menuItem.category}</td>
                  <td>{menuItem.variantSummary}</td>
                  <td className="menu-modifier-cell">{menuItem.modifierSummary}</td>
                  <td className="catalog-price-cell">{menuItem.price}</td>
                  <td><span className={`catalog-status ${menuItem.status === 'Available' ? 'status-active' : 'status-inactive'}`}><span />{menuItem.status}</span></td>
                  <td>
                    <div className="catalog-row-actions">
                      <button type="button" className="row-action-button" onClick={() => openEditMenuItemForm(menuItem)} aria-label={`Edit ${menuItem.name}`} title="Edit demo menu item"><Pencil size={15} /></button>
                      <button type="button" className="row-action-button" onClick={() => handleMarkUnavailable(menuItem)} aria-label={`Change availability for ${menuItem.name} (not connected)`} title="Availability handler is a TODO"><MoreHorizontal size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">Variant, modifier, and availability examples are static demo content. Search and filters are not connected.</p>
      </section>

      {isFormOpen && (
        <MenuItemFormDialog
          key={activeMenuItem?.id || 'new-menu-item'}
          menuItem={activeMenuItem}
          onClose={closeMenuItemForm}
          onSubmit={activeMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}
        />
      )}
    </AdminLayout>
  )
}

export default ProductsPage
