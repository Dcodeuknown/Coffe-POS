import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Boxes, CirclePlus, Coffee, Pencil, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoMenuCategories } from '../../data/demoCatalogData.js'

function CategoryFormDialog({ category, onClose, onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: category || { name: '', description: '', status: 'Active' },
  })

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="catalog-dialog category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MENU ORGANIZATION</span>
            <h2 id="category-dialog-title">{category ? 'Edit category' : 'Add category'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close category form"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Form preview only. Submitting will not save or change category data.</p>

        <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="catalog-form-grid category-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="category-name">Category name</label>
              <input id="category-name" placeholder="e.g. Beverages" aria-invalid={Boolean(errors.name)} {...register('name')} />
              {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="category-description">Description <span className="optional-label">Optional</span></label>
              <textarea id="category-description" rows="3" placeholder="Briefly describe this category" {...register('description')} />
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="category-status">Status</label>
              <select id="category-status" {...register('status')}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="catalog-button button-primary" type="submit">{category ? 'Save changes' : 'Add category'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  function openNewCategoryForm() {
    setActiveCategory(null)
    setIsFormOpen(true)
  }

  function openEditCategoryForm(category) {
    setActiveCategory(category)
    setIsFormOpen(true)
  }

  function closeCategoryForm() {
    setIsFormOpen(false)
    setActiveCategory(null)
  }

  function handleCreateCategory(formValues) {
    // TODO (MANUAL): Implement category creation and connect the form to the category API.
    // Expected input: the category name, description, and status from React Hook Form.
    // Expected output: later, create the category through the backend and handle its response.
    void formValues
  }

  function handleUpdateCategory(formValues) {
    // TODO (MANUAL): Implement category updates and connect the form to the category API.
    // Expected input: edited category fields and the selected category ID.
    // Expected output: later, update the backend record and handle success or error states.
    void formValues
  }

  function handleDeactivateCategory(category) {
    // TODO (MANUAL): Implement category deactivation according to the backend's category rules.
    // Expected input: the selected category ID.
    // Expected output: later, request deactivation and refresh the displayed categories.
    void category
  }

  return (
    <AdminLayout>
      <div className="catalog-page-heading">
        <div>
          <span className="eyebrow">CATALOG MANAGEMENT</span>
          <h1>Categories</h1>
            <p>Organize the coffee shop menu by drink and food category.</p>
        </div>
        <button className="catalog-button button-primary" type="button" onClick={openNewCategoryForm}>
          <CirclePlus size={16} aria-hidden="true" /> Add category
        </button>
      </div>

      <div className="demo-data-banner" role="note">
        <span className="demo-banner-dot" /> Demo menu categories only. Forms do not save changes.
      </div>

      <section className="catalog-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>All categories</h2>
            <p>{demoMenuCategories.length} demo categories</p>
          </div>
          <a className="catalog-switch-link" href="/admin/products"><Coffee size={15} aria-hidden="true" /> View menu items</a>
        </div>

        <div className="category-grid">
          {demoMenuCategories.map((category) => (
            <article className="category-card" key={category.id}>
              <div className="category-card-top">
                <span className="category-icon"><Boxes size={19} aria-hidden="true" /></span>
                <span className={`catalog-status ${category.status === 'Active' ? 'status-active' : 'status-inactive'}`}><span />{category.status}</span>
              </div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <div className="category-card-bottom">
                <span className="category-product-count"><Coffee size={14} aria-hidden="true" />{category.menuItemCount} demo menu items</span>
                <div className="catalog-row-actions">
                  <button type="button" className="row-action-button" onClick={() => openEditCategoryForm(category)} aria-label={`Edit ${category.name}`} title="Edit demo category"><Pencil size={15} /></button>
                  <button type="button" className="row-action-button" onClick={() => handleDeactivateCategory(category)} aria-label={`Deactivate ${category.name} (not connected)`} title="Deactivation logic is a TODO"><span className="deactivate-symbol" aria-hidden="true">−</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="catalog-table-footnote">Menu-item counts and statuses are sample values for this UI preview.</p>
      </section>

      {isFormOpen && (
        <CategoryFormDialog
          key={activeCategory?.id || 'new-category'}
          category={activeCategory}
          onClose={closeCategoryForm}
          onSubmit={activeCategory ? handleUpdateCategory : handleCreateCategory}
        />
      )}
    </AdminLayout>
  )
}

export default CategoriesPage
