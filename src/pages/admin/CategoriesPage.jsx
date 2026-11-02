import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Boxes, CirclePlus, Coffee, Pencil, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'

function CategoryFormDialog({ category, onClose, onSubmit, isSaving, saveError }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      is_active: category?.is_active ?? true,
    },
  })

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <section className="catalog-dialog category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">MENU ORGANIZATION</span><h2 id="category-dialog-title">{category ? 'Edit category' : 'Add category'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close category form"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Category changes are saved to the POS API.</p>
        <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="catalog-form-grid category-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="category-name">Category name</label>
              <input id="category-name" maxLength={255} aria-invalid={Boolean(errors.name)} {...register('name', { required: 'Enter a category name.', maxLength: { value: 255, message: 'Use 255 characters or fewer.' } })} />
              {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="category-description">Description <span className="optional-label">Optional</span></label>
              <textarea id="category-description" rows="3" maxLength={255} {...register('description')} />
            </div>
            {category && (
              <div className="catalog-field field-span-two">
                <label htmlFor="category-status">Status</label>
                <select id="category-status" {...register('is_active', { setValueAs: (value) => value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
          {saveError && <p className="field-error" role="alert">{saveError}</p>}
          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className="catalog-button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : category ? 'Save changes' : 'Add category'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savingCategoryId, setSavingCategoryId] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  async function loadCategories() {
    setIsLoading(true)
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoadError('You are not signed in. Please sign in again.')
      setIsLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/admin/menu/categories', { headers }),
        fetch('http://127.0.0.1:8000/admin/menu/items', { headers }),
      ])
      if (!categoryResponse.ok || !itemResponse.ok) {
        throw new Error(`Could not load categories (HTTP ${!categoryResponse.ok ? categoryResponse.status : itemResponse.status}).`)
      }
      setCategories(await categoryResponse.json())
      setMenuItems(await itemResponse.json())
      setLoadError('')
    } catch (error) {
      setLoadError(error.message || 'Could not load categories.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  function openForm(category = null) {
    setSaveError('')
    setActiveCategory(category)
    setIsFormOpen(true)
  }

  async function saveCategory(formValues) {
    setSaveError('')
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setSaveError('Your session has expired. Sign in again.')
      return
    }
    setIsSaving(true)
    try {
      const url = activeCategory
        ? `http://127.0.0.1:8000/menu/categories/${activeCategory.id}`
        : 'http://127.0.0.1:8000/menu/categories'
      const response = await fetch(url, {
        method: activeCategory ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formValues.name.trim(),
          description: formValues.description.trim() || null,
          ...(activeCategory ? { is_active: formValues.is_active } : {}),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not save category (HTTP ${response.status}).`)
      }
      await loadCategories()
      setIsFormOpen(false)
      setActiveCategory(null)
    } catch (error) {
      setSaveError(error.message || 'Could not save category.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleCategory(category) {
    setSaveError('')
    setSavingCategoryId(category.id)
    const token = sessionStorage.getItem('access_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/menu/categories/${category.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !category.is_active }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not update category (HTTP ${response.status}).`)
      }
      const updated = await response.json()
      setCategories((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (error) {
      setSaveError(error.message || 'Could not update category status.')
    } finally {
      setSavingCategoryId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="catalog-page-heading">
        <div><span className="eyebrow">CATALOG MANAGEMENT</span><h1>Categories</h1><p>Organize the coffee shop menu by drink and food category.</p></div>
        <button className="catalog-button button-primary" type="button" onClick={() => openForm()}><CirclePlus size={16} aria-hidden="true" /> Add category</button>
      </div>
      {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
      {saveError && !isFormOpen && <p className="field-error" role="alert">{saveError}</p>}
      <section className="catalog-panel">
        <div className="catalog-panel-header">
          <div><h2>Menu categories</h2><p>{isLoading ? 'Loading...' : `${categories.length} categories`}</p></div>
          <a className="catalog-switch-link" href="/admin/products"><Coffee size={15} aria-hidden="true" /> View menu items</a>
        </div>
        {isLoading ? <p className="catalog-table-footnote">Loading category data...</p> : categories.length === 0 ? <p className="catalog-table-footnote">No categories have been created yet.</p> : (
          <div className="category-grid">
            {categories.map((category) => {
              const itemCount = menuItems.filter((item) => item.category_id === category.id).length
              return (
                <article className="category-card" key={category.id}>
                  <div className="category-card-top">
                    <span className="category-icon"><Boxes size={19} aria-hidden="true" /></span>
                    <span className={`catalog-status ${category.is_active ? 'status-active' : 'status-inactive'}`}><span />{category.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'No description'}</p>
                  <div className="category-card-bottom">
                    <span className="category-product-count"><Coffee size={14} aria-hidden="true" />{itemCount} menu items</span>
                    <div className="catalog-row-actions">
                      <button type="button" className="row-action-button" onClick={() => openForm(category)} aria-label={`Edit ${category.name}`} title="Edit category"><Pencil size={15} /></button>
                      <button type="button" className="row-action-button" disabled={savingCategoryId !== null} onClick={() => toggleCategory(category)} aria-label={`${category.is_active ? 'Deactivate' : 'Reactivate'} ${category.name}`} title={category.is_active ? 'Deactivate category' : 'Reactivate category'}>{savingCategoryId === category.id ? '…' : category.is_active ? '−' : '+'}</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
        <p className="catalog-table-footnote">Deactivating a category hides its menu items from the POS. Its records remain available to admins.</p>
      </section>
      {isFormOpen && <CategoryFormDialog key={activeCategory?.id || 'new-category'} category={activeCategory} onClose={() => { setIsFormOpen(false); setActiveCategory(null) }} onSubmit={saveCategory} isSaving={isSaving} saveError={saveError} />}
    </AdminLayout>
  )
}

export default CategoriesPage
