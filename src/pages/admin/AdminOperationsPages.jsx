import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowUpRight, BarChart3, BookOpen, ClipboardList, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { formatQuantity } from '../../utils/measurements.js'

// Renders the shared title, description, and optional action button for admin pages.
function AdminPageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="catalog-page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  )
}

// Displays a notice that explains when a page or section still uses preview data.
function DemoBanner({ children }) {
  return <div className="demo-data-banner admin-ops-banner" role="note"><span className="demo-banner-dot" />{children}</div>
}

// Shows the recipe form and sends its validated data to the backend API.
function RecipeEditorDialog({ onClose, onSaved, menuItems, ingredients }) {
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [recipeLines, setRecipeLines] = useState([
    { ingredient_id: '', quantity_required: '', unit: '' },
  ])
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Stores the chosen ingredient and fills its required base unit into that row.
  function updateIngredient(rowIndex, ingredientId) {
    const ingredient = ingredients.find(
      (item) => item.id === Number(ingredientId),
    )

    setRecipeLines((currentLines) =>
      currentLines.map((line, index) =>
        index === rowIndex
          ? {
              ...line,
              ingredient_id: ingredientId,
              // The API currently requires recipe units to match the ingredient base unit.
              unit: ingredient?.base_unit ?? '',
            }
          : line,
      ),
    )
  }

  // Updates the quantity value for one ingredient row as the user types.
  function updateQuantity(rowIndex, quantity) {
    setRecipeLines((currentLines) =>
      currentLines.map((line, index) =>
        index === rowIndex ? { ...line, quantity_required: quantity } : line,
      ),
    )
  }

  // Adds a blank ingredient row so the recipe can include another ingredient.
  function addIngredientRow() {
    setRecipeLines((currentLines) => [
      ...currentLines,
      { ingredient_id: '', quantity_required: '', unit: '' },
    ])
  }

  // Removes the selected blank or filled row, while keeping one recipe row available.
  function removeIngredientRow(rowIndex) {
    setRecipeLines((currentLines) =>
      currentLines.length > 1
        ? currentLines.filter((_, index) => index !== rowIndex)
        : currentLines,
    )
    setSaveError('')
  }

  // Validates the form, posts it with the saved bearer token, and reports errors.
  async function submitRecipe(event) {
    event.preventDefault()
    setSaveError('')

    if (!selectedVariantId) {
      setSaveError('Choose a menu variant first.')
      return
    }

    if (recipeLines.length === 0 || recipeLines.some((line) => !line.ingredient_id)) {
      setSaveError('Choose an ingredient for every recipe row.')
      return
    }

    const ingredientIds = recipeLines.map((line) => Number(line.ingredient_id))
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      setSaveError('Each ingredient can only appear once in a recipe version.')
      return
    }

    if (
      recipeLines.some(
        (line) =>
          !line.quantity_required ||
          !Number.isFinite(Number(line.quantity_required)) ||
          Number(line.quantity_required) <= 0,
      )
    ) {
      setSaveError('Enter a quantity greater than zero for every ingredient.')
      return
    }

    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setSaveError('Your session has expired. Sign in again and retry.')
      return
    }

    setIsSaving(true)
    let wasSaved = false

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/menu/variants/${selectedVariantId}/recipe-versions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ingredients: recipeLines.map((line) => ({
              ingredient_id: Number(line.ingredient_id),
              quantity_required: line.quantity_required,
              unit: line.unit,
            })),
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = errorData?.detail
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail
        throw new Error(message || `Could not save recipe (HTTP ${response.status}).`)
      }

      await response.json()
      wasSaved = true
    } catch (error) {
      setSaveError(error.message || 'Could not save the recipe.')
    } finally {
      setIsSaving(false)
    }

    if (wasSaved) {
      onSaved()
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="catalog-dialog recipe-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-editor-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">RECIPE EDITOR</span>
            <h2 id="recipe-editor-title">New recipe</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close recipe editor"
          >
            <X size={18} />
          </button>
        </div>

        <p className="dialog-preview-note">
          Add the ingredient amounts required to prepare one serving of this menu variant.
        </p>

        <form className="catalog-form" onSubmit={submitRecipe}>
          <div className="catalog-field">
            <label htmlFor="recipe-variant">Menu variant</label>
            <select
              id="recipe-variant"
              required
              value={selectedVariantId}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              <option value="">Choose a menu variant</option>
              {menuItems.map((menuItem) =>
                menuItem.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {menuItem.name} - {variant.variant_name}
                  </option>
                )),
              )}
            </select>
          </div>

          <div className="recipe-editor-section">
            <div className="recipe-editor-subhead">
              <div>
                <strong>Ingredients per serving</strong>
                <small>Units are filled from each ingredient's base unit.</small>
              </div>
              <button
                className="recipe-add-row"
                type="button"
                onClick={addIngredientRow}
              >
                <Plus size={14} /> Add ingredient row
              </button>
            </div>

            {ingredients.length === 0 ? (
              <p className="recipe-rule-note">
                No active ingredients are available. Add an ingredient before creating its recipe.
              </p>
            ) : (
              <div className="recipe-line-table">
                <div className="recipe-line-header">
                  <span>Ingredient</span>
                  <span>Quantity</span>
                  <span>Base unit</span>
                  <span className="recipe-remove-heading" aria-hidden="true" />
                </div>

                {recipeLines.map((line, rowIndex) => (
                  <div className="recipe-line-row" key={rowIndex}>
                    <select
                      aria-label={`Ingredient row ${rowIndex + 1}`}
                      required
                      value={line.ingredient_id}
                      onChange={(event) =>
                        updateIngredient(rowIndex, event.target.value)
                      }
                    >
                      <option value="">Choose ingredient</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>

                    <input
                      aria-label={`Quantity row ${rowIndex + 1}`}
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="0"
                      inputMode="decimal"
                      required
                      value={line.quantity_required}
                      onChange={(event) =>
                        updateQuantity(rowIndex, event.target.value)
                      }
                    />

                    <input
                      aria-label={`Base unit row ${rowIndex + 1}`}
                      value={line.unit}
                      placeholder="Unit"
                      readOnly
                    />

                    <button
                      className="recipe-remove-row"
                      type="button"
                      disabled={recipeLines.length === 1 || isSaving}
                      onClick={() => removeIngredientRow(rowIndex)}
                      aria-label={`Remove ingredient row ${rowIndex + 1}`}
                      title={recipeLines.length === 1 ? 'At least one row is required' : 'Remove ingredient row'}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saveError && (
            <p className="field-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="dialog-actions">
            <button
              className="catalog-button button-quiet"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="catalog-button button-primary"
              type="submit"
              disabled={isSaving || ingredients.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save recipe'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Loads and displays saved recipe versions, and supplies menu/ingredient data to the form.
export function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Reloads menu, ingredient, and recipe data on page entry and after a recipe is saved.
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setLoadError('')

    // Fetch menu, ingredients, and recipe versions whenever the list needs refreshing.
    async function loadRecipes() {
      const token = sessionStorage.getItem('access_token')

      if (!token) {
        setLoadError('You are not signed in. Please sign in again.')
        setIsLoading(false)
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Makes an authenticated GET request and turns API errors into readable messages.
      async function getJson(url) {
        const response = await fetch(`http://127.0.0.1:8000${url}`, {
          headers,
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}.`)
        }

        return response.json()
      }

      try {
        // Load the active menu and ingredient names for the recipe list.
        const [menuItems, ingredients] = await Promise.all([
          getJson('/menu/items'),
          getJson('/ingredients'),
        ])

        const ingredientNames = new Map(
          ingredients.map((ingredient) => [ingredient.id, ingredient.name]),
        )

        // Fetch saved recipe versions for every menu variant.
        const recipeRequests = menuItems.flatMap((menuItem) =>
          menuItem.variants.map(async (variant) => {
            const versions = await getJson(
              `/menu/variants/${variant.id}/recipe-versions`,
            )

            return versions.map((version) => ({
              ...version,
              menuItemName: menuItem.name,
              variantName: variant.variant_name,
              ingredients: version.ingredients.map((line) => ({
                ...line,
                ingredientName:
                  ingredientNames.get(line.ingredient_id) ??
                  `Ingredient #${line.ingredient_id}`,
              })),
            }))
          }),
        )

        const savedRecipes = (await Promise.all(recipeRequests)).flat()

        if (isMounted) {
          setMenuItems(menuItems)
          setAvailableIngredients(
            ingredients.filter((ingredient) => ingredient.is_active),
          )
          setRecipes(savedRecipes)
          setLoadError('')
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || 'Could not load recipes from the API.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRecipes()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  return (
    <AdminLayout>
      <AdminPageHeading
        eyebrow="MENU PREPARATION"
        title="Recipes"
        description="Saved recipe versions loaded from the POS API."
        action={
          <button
            className="catalog-button button-primary"
            type="button"
            onClick={() => {
              setEditorOpen(true)
            }}
          >
            <Plus size={16} /> New recipe
          </button>
        }
      />

      <DemoBanner>
        Recipe versions are saved through the API. Creating a version does not change stock.
      </DemoBanner>

      {loadError && (
        <div className="demo-data-banner admin-ops-banner" role="alert">
          {loadError}
        </div>
      )}

      <section className="catalog-panel admin-ops-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Saved recipe versions</h2>
            <p>{isLoading ? 'Loading recipes...' : `${recipes.length} saved versions`}</p>
          </div>
          <span className="admin-panel-icon">
            <BookOpen size={17} />
          </span>
        </div>

        {isLoading ? (
          <p className="catalog-table-footnote">Loading recipe data from the API...</p>
        ) : recipes.length === 0 && !loadError ? (
          <p className="catalog-table-footnote">
            No saved recipes were found for the active menu variants.
          </p>
        ) : (
          <div className="catalog-table-scroll">
            <table className="catalog-table recipe-table">
              <thead>
                <tr>
                  <th>Menu item</th>
                  <th>Variant</th>
                  <th>Version</th>
                  <th>Effective from</th>
                  <th>Ingredients per serving</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td><strong>{recipe.menuItemName}</strong></td>
                    <td>{recipe.variantName}</td>
                    <td>{recipe.version_number}</td>
                    <td>{new Date(recipe.effective_from).toLocaleString()}</td>
                    <td>
                      {recipe.ingredients.map((ingredient) => (
                        <div key={ingredient.id}>
                          {ingredient.ingredientName}: {ingredient.quantity_required} {ingredient.unit}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* A successful save closes the dialog and refreshes the displayed recipes. */}
      {editorOpen && (
        <RecipeEditorDialog
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false)
            setRefreshKey((currentKey) => currentKey + 1)
          }}
          menuItems={menuItems}
          ingredients={availableIngredients}
        />
      )}
    </AdminLayout>
  )
}
function SupplierFormDialog({ supplier, onClose, onSubmit, isSaving, saveError }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: supplier?.name ?? '',
      contact_person: supplier?.contact_person ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      is_active: supplier?.is_active ?? true,
    },
  })
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
      <section className="catalog-dialog supplier-form-dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
        <div className="dialog-heading"><div><span className="eyebrow">SUPPLIER DETAILS</span><h2 id="supplier-form-title">{supplier ? 'Edit supplier' : 'Add supplier'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close supplier form"><X size={18} /></button></div>
        <p className="dialog-preview-note">Supplier details are saved to the POS API.</p>
        <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="catalog-form-grid">
            <div className="catalog-field field-span-two"><label htmlFor="supplier-name">Supplier name</label><input id="supplier-name" maxLength={155} aria-invalid={Boolean(errors.name)} {...register('name', { required: 'Enter a supplier name.' })} />{errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}</div>
            <div className="catalog-field"><label htmlFor="supplier-contact">Contact person</label><input id="supplier-contact" maxLength={155} {...register('contact_person')} /></div>
            <div className="catalog-field"><label htmlFor="supplier-phone">Phone</label><input id="supplier-phone" type="tel" maxLength={45} {...register('phone')} /></div>
            <div className="catalog-field field-span-two"><label htmlFor="supplier-email">Email</label><input id="supplier-email" type="email" maxLength={155} {...register('email')} /></div>
            <div className="catalog-field field-span-two"><label htmlFor="supplier-address">Address</label><textarea id="supplier-address" rows="2" {...register('address')} /></div>
            {supplier && <div className="catalog-field field-span-two"><label htmlFor="supplier-status">Status</label><select id="supplier-status" {...register('is_active', { setValueAs: (value) => value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></div>}
          </div>
          {saveError && <p className="field-error" role="alert">{saveError}</p>}
          <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose} disabled={isSaving}>Cancel</button><button className="catalog-button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : supplier ? 'Save supplier' : 'Add supplier'}</button></div>
        </form>
      </section>
    </div>
  )
}

// Loads suppliers and actual receipt history, and provides supplier CRUD actions.
export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [receipts, setReceipts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savingSupplierId, setSavingSupplierId] = useState(null)
  const [activeSupplier, setActiveSupplier] = useState(null)
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)

  async function loadSupplierData() {
    setIsLoading(true)
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoadError('You are not signed in. Please sign in again.')
      setIsLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const responses = await Promise.all([
        fetch('http://127.0.0.1:8000/suppliers', { headers }),
        fetch('http://127.0.0.1:8000/stock-receipts', { headers }),
        fetch('http://127.0.0.1:8000/ingredients', { headers }),
      ])
      const failed = responses.find((response) => !response.ok)
      if (failed) throw new Error(`Could not load supplier data (HTTP ${failed.status}).`)
      const [supplierData, receiptData, ingredientData] = await Promise.all(responses.map((response) => response.json()))
      setSuppliers(supplierData)
      setReceipts(receiptData)
      setIngredients(ingredientData)
      setLoadError('')
    } catch (error) {
      setLoadError(error.message || 'Could not load supplier data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadSupplierData() }, [])

  async function saveSupplier(formValues) {
    setSaveError('')
    const token = sessionStorage.getItem('access_token')
    if (!token) { setSaveError('Your session has expired. Sign in again.'); return }
    setIsSaving(true)
    try {
      const response = await fetch(
        activeSupplier ? `http://127.0.0.1:8000/suppliers/${activeSupplier.id}` : 'http://127.0.0.1:8000/suppliers',
        {
          method: activeSupplier ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formValues.name.trim(),
            contact_person: formValues.contact_person.trim() || null,
            phone: formValues.phone.trim() || null,
            email: formValues.email.trim() || null,
            address: formValues.address.trim() || null,
            ...(activeSupplier ? { is_active: formValues.is_active } : {}),
          }),
        },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not save supplier (HTTP ${response.status}).`)
      }
      await loadSupplierData()
      setSupplierFormOpen(false)
      setActiveSupplier(null)
    } catch (error) {
      setSaveError(error.message || 'Could not save supplier.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleSupplier(supplier) {
    setSavingSupplierId(supplier.id)
    const token = sessionStorage.getItem('access_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/suppliers/${supplier.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !supplier.is_active }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not update supplier (HTTP ${response.status}).`)
      }
      const updated = await response.json()
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (error) {
      setLoadError(error.message || 'Could not update supplier status.')
    } finally {
      setSavingSupplierId(null)
    }
  }

  const supplierNames = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]))
  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]))

  return <AdminLayout>
    <AdminPageHeading eyebrow="STOCK SOURCES" title="Suppliers and receiving" description="Manage supplier contacts and review actual stock receipts." action={<div className="supplier-heading-actions"><button className="catalog-button button-primary" type="button" onClick={() => { setActiveSupplier(null); setSaveError(''); setSupplierFormOpen(true) }}><Plus size={16} /> Add supplier</button><a className="catalog-button button-quiet" href="/admin/inventory"><ClipboardList size={16} /> Open receiving form</a></div>} />
    {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Suppliers</h2><p>{isLoading ? 'Loading suppliers...' : `${suppliers.length} suppliers`}</p></div><span className="admin-panel-icon"><ClipboardList size={17} /></span></div>
      {isLoading ? <p className="catalog-table-footnote">Loading supplier records...</p> : suppliers.length === 0 ? <p className="catalog-table-footnote">No suppliers have been added.</p> : <div className="supplier-card-grid">{suppliers.map((supplier) => <article className="supplier-card" key={supplier.id}><div className="supplier-card-top"><span className="admin-panel-icon"><ClipboardList size={16} /></span><span className={`ops-status ${supplier.is_active ? 'ops-status-active' : ''}`}>{supplier.is_active ? 'Active' : 'Inactive'}</span></div><h3>{supplier.name}</h3><p>{supplier.contact_person || 'No contact person listed'}</p><div><small>Supplier ID</small><strong>{supplier.id}</strong></div><div><small>Contact details</small><strong>{supplier.email || supplier.phone || 'No contact details'}</strong></div><div className="catalog-row-actions"><button type="button" className="row-action-button" onClick={() => { setActiveSupplier(supplier); setSaveError(''); setSupplierFormOpen(true) }} aria-label={`Edit ${supplier.name}`}><Pencil size={15} /></button><button type="button" className="catalog-button button-quiet" disabled={savingSupplierId !== null} onClick={() => toggleSupplier(supplier)}>{savingSupplierId === supplier.id ? 'Saving...' : supplier.is_active ? 'Deactivate' : 'Reactivate'}</button></div></article>)}</div>}
      <p className="catalog-table-footnote">Inactive suppliers remain in existing receipt history but cannot be selected for new receipts.</p>
    </section>
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Receiving history</h2><p>{isLoading ? 'Loading receipts...' : `${receipts.length} receipts recorded`}</p></div><a className="catalog-switch-link" href="/admin/inventory">Manage ingredient stock <ArrowUpRight size={14} /></a></div>
      <div className="catalog-table-scroll"><table className="catalog-table receiving-table"><thead><tr><th>Receipt</th><th>Supplier</th><th>Items received</th><th>Quantities</th><th>Received</th><th>Status</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="6">Loading receipt history...</td></tr> : receipts.length === 0 ? <tr><td colSpan="6">No receipts have been recorded.</td></tr> : receipts.map((receipt) => <tr key={receipt.id}><td><strong>{receipt.receipt_number}</strong></td><td>{supplierNames.get(receipt.supplier_id) || `Supplier #${receipt.supplier_id}`}</td><td>{receipt.items.map((item) => `${ingredientNames.get(item.ingredient_id) || `Ingredient #${item.ingredient_id}`}`).join(', ')}</td><td>{receipt.items.map((item) => `${item.quantity_received} ${item.received_unit}`).join(', ')}</td><td>{new Date(receipt.received_at).toLocaleString()}</td><td>{receipt.status}</td></tr>)}</tbody></table></div>
    </section>
    {supplierFormOpen && <SupplierFormDialog supplier={activeSupplier} onClose={() => { setSupplierFormOpen(false); setActiveSupplier(null) }} onSubmit={saveSupplier} isSaving={isSaving} saveError={saveError} />}
  </AdminLayout>
}

function UserInviteDialog({ user, roles, onClose, onSubmit, isSaving, saveError }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      full_name: user?.full_name ?? '',
      username: user?.username ?? '',
      password: '',
      role_id: user ? String(user.role_id) : '',
      is_active: user?.is_active ?? true,
    },
  })
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
    <section className="catalog-dialog user-invite-dialog" role="dialog" aria-modal="true" aria-labelledby="user-invite-title">
      <div className="dialog-heading"><div><span className="eyebrow">TEAM ACCESS</span><h2 id="user-invite-title">{user ? 'Edit team member' : 'Add team member'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close user form"><X size={18} /></button></div>
      <p className="dialog-preview-note">New accounts receive a password you set here. Share it with the team member securely.</p>
      <form className="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="catalog-form-grid">
          <div className="catalog-field field-span-two"><label htmlFor="team-full-name">Full name</label><input id="team-full-name" maxLength={155} aria-invalid={Boolean(errors.full_name)} {...register('full_name', { required: 'Enter the team member name.' })} />{errors.full_name && <span className="field-error" role="alert">{errors.full_name.message}</span>}</div>
          <div className="catalog-field"><label htmlFor="team-username">Username</label><input id="team-username" maxLength={155} disabled={Boolean(user)} aria-invalid={Boolean(errors.username)} {...register('username', { required: 'Enter a username.' })} />{errors.username && <span className="field-error" role="alert">{errors.username.message}</span>}</div>
          {!user && <div className="catalog-field"><label htmlFor="team-password">Temporary password</label><input id="team-password" type="password" minLength={8} maxLength={128} autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password', { required: 'Enter a temporary password.', minLength: { value: 8, message: 'Use at least 8 characters.' }, maxLength: { value: 128, message: 'Use 128 characters or fewer.' } })} />{errors.password && <span className="field-error" role="alert">{errors.password.message}</span>}</div>}
          <div className="catalog-field"><label htmlFor="team-role">Role</label><select id="team-role" aria-invalid={Boolean(errors.role_id)} {...register('role_id', { required: 'Choose a role.' })}><option value="">Choose a role</option>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select>{errors.role_id && <span className="field-error" role="alert">{errors.role_id.message}</span>}</div>
          {user && <div className="catalog-field"><label htmlFor="team-status">Status</label><select id="team-status" {...register('is_active', { setValueAs: (value) => value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></div>}
        </div>
        {saveError && <p className="field-error" role="alert">{saveError}</p>}
        <p className="role-permission-note">Roles control access to protected API actions. Only assign a role the team member needs.</p>
        <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose} disabled={isSaving}>Cancel</button><button className="catalog-button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : user ? 'Save changes' : 'Create account'}</button></div>
      </form>
    </section>
  </div>
}

// Loads real team accounts and roles, and manages accounts through the Admin API.
export function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingCashierRole, setIsCreatingCashierRole] = useState(false)
  const [savingUserId, setSavingUserId] = useState(null)
  const [activeUser, setActiveUser] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  async function loadUsers() {
    setIsLoading(true)
    const token = sessionStorage.getItem('access_token')
    if (!token) { setLoadError('You are not signed in. Please sign in again.'); setIsLoading(false); return }
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const responses = await Promise.all([
        fetch('http://127.0.0.1:8000/admin/users', { headers }),
        fetch('http://127.0.0.1:8000/admin/roles', { headers }),
      ])
      const failed = responses.find((response) => !response.ok)
      if (failed) throw new Error(`Could not load team access (HTTP ${failed.status}).`)
      const [userData, roleData] = await Promise.all(responses.map((response) => response.json()))
      setUsers(userData)
      setRoles(roleData)
      setLoadError('')
    } catch (error) {
      setLoadError(error.message || 'Could not load team accounts.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => { loadUsers() }, [])

  async function createCashierRole() {
    setLoadError('')
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoadError('Your session has expired. Sign in again.')
      return
    }
    setIsCreatingCashierRole(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/admin/roles/cashier', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Cashier and point-of-sale access' }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not create Cashier role (HTTP ${response.status}).`)
      }
      await loadUsers()
    } catch (error) {
      setLoadError(error.message || 'Could not create Cashier role.')
    } finally {
      setIsCreatingCashierRole(false)
    }
  }

  async function saveUser(formValues) {
    setSaveError('')
    const token = sessionStorage.getItem('access_token')
    if (!token) { setSaveError('Your session has expired. Sign in again.'); return }
    setIsSaving(true)
    try {
      const response = await fetch(
        activeUser ? `http://127.0.0.1:8000/admin/users/${activeUser.id}` : 'http://127.0.0.1:8000/admin/users',
        {
          method: activeUser ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(activeUser
            ? { full_name: formValues.full_name.trim(), role_id: Number(formValues.role_id), is_active: formValues.is_active }
            : { full_name: formValues.full_name.trim(), username: formValues.username.trim(), password: formValues.password, role_id: Number(formValues.role_id) }),
        },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not save account (HTTP ${response.status}).`)
      }
      await loadUsers()
      setFormOpen(false)
      setActiveUser(null)
    } catch (error) {
      setSaveError(error.message || 'Could not save team account.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleUser(user) {
    setSavingUserId(user.id)
    const token = sessionStorage.getItem('access_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not update account (HTTP ${response.status}).`)
      }
      const updated = await response.json()
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (error) {
      setLoadError(error.message || 'Could not update account status.')
    } finally {
      setSavingUserId(null)
    }
  }

  return <AdminLayout>
    <AdminPageHeading eyebrow="TEAM ACCESS" title="Users" description="Manage staff accounts and role-based access." action={<div className="supplier-heading-actions">{!roles.some((role) => role.name === 'Cashier') && <button className="catalog-button button-quiet" type="button" onClick={createCashierRole} disabled={isLoading || isCreatingCashierRole}>{isCreatingCashierRole ? 'Adding role...' : 'Add Cashier role'}</button>}<button className="catalog-button button-primary" type="button" onClick={() => { setActiveUser(null); setSaveError(''); setFormOpen(true) }} disabled={isLoading}><Users size={16} /> Add team member</button></div>} />
    {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Team members</h2><p>{isLoading ? 'Loading accounts...' : `${users.length} accounts`}</p></div><span className="admin-panel-icon"><Users size={17} /></span></div>
      <div className="catalog-table-scroll"><table className="catalog-table users-table"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="6">Loading team accounts...</td></tr> : users.length === 0 ? <tr><td colSpan="6">No team accounts found.</td></tr> : users.map((user) => <tr key={user.id}><td><strong>{user.full_name}</strong></td><td>{user.username}</td><td><span className={`role-chip role-${user.role_name.toLowerCase()}`}>{user.role_name}</span></td><td><span className={`ops-status ${user.is_active ? 'ops-status-active' : ''}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td><td>{new Date(user.created_at).toLocaleDateString()}</td><td><div className="catalog-row-actions"><button className="row-action-button" type="button" onClick={() => { setActiveUser(user); setSaveError(''); setFormOpen(true) }} aria-label={`Edit ${user.full_name}`}><Pencil size={15} /></button><button className="catalog-button button-quiet" type="button" disabled={savingUserId !== null} onClick={() => toggleUser(user)}>{savingUserId === user.id ? 'Saving...' : user.is_active ? 'Deactivate' : 'Reactivate'}</button></div></td></tr>)}</tbody></table></div>
      <p className="catalog-table-footnote">Passwords are stored as hashes. Deactivating an account prevents new sign-ins.</p>
    </section>
    {formOpen && <UserInviteDialog user={activeUser} roles={roles} onClose={() => { setFormOpen(false); setActiveUser(null) }} onSubmit={saveUser} isSaving={isSaving} saveError={saveError} />}
  </AdminLayout>
}

// Shows live inventory reporting; sales metrics wait for checkout data to exist.
export function ReportsPage() {
  const [ingredients, setIngredients] = useState([])
  const [movements, setMovements] = useState([])
  const [receipts, setReceipts] = useState([])
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        setLoadError('You are not signed in. Please sign in again.')
        setIsLoading(false)
        return
      }

      const headers = { Authorization: `Bearer ${token}` }
      try {
        const responses = await Promise.all([
          fetch('http://127.0.0.1:8000/ingredients', { headers }),
          fetch('http://127.0.0.1:8000/stock-movements', { headers }),
          fetch('http://127.0.0.1:8000/stock-receipts', { headers }),
          fetch('http://127.0.0.1:8000/sales', { headers }),
        ])
        const failed = responses.find((response) => !response.ok)
        if (failed) throw new Error(`Could not load reports (HTTP ${failed.status}).`)
        const [ingredientData, movementData, receiptData, salesData] = await Promise.all(
          responses.map((response) => response.json()),
        )
        if (isMounted) {
          setIngredients(ingredientData)
          setMovements(movementData)
          setReceipts(receiptData)
          setSales(salesData)
          setLoadError('')
        }
      } catch (error) {
        if (isMounted) setLoadError(error.message || 'Could not load reports.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadReports()
    return () => { isMounted = false }
  }, [])

  const activeIngredients = ingredients.filter((item) => item.is_active)
  const lowStock = activeIngredients.filter(
    (item) => Number(item.current_quantity) <= Number(item.low_stock_threshold),
  )
  const salesRevenue = sales.reduce((total, sale) => total + Number(sale.total_amount), 0)
  const bestSellers = Object.values(sales.flatMap((sale) => sale.items).reduce((itemsByName, item) => {
    const itemSummary = itemsByName[item.item_name] || { name: item.item_name, quantity: 0 }
    itemSummary.quantity += item.quantity
    itemsByName[item.item_name] = itemSummary
    return itemsByName
  }, {})).sort((first, second) => second.quantity - first.quantity).slice(0, 5)
  const movementCounts = ['receipt', 'adjustment', 'waste', 'sale_use'].map((type) => ({
    type,
    count: movements.filter((movement) => movement.movement_type === type).length,
  }))
  const recentMovements = movements.slice(0, 12)
  const metrics = [
    { label: 'Active ingredients', value: activeIngredients.length, detail: 'Currently tracked' },
    { label: 'Low or out of stock', value: lowStock.length, detail: 'At or below reorder level' },
    { label: 'Stock receipts', value: receipts.length, detail: 'Recorded deliveries' },
    { label: 'Sales revenue', value: salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), detail: `Recent ${sales.length} completed sales; discounts and tax are zero` },
  ]

  return <AdminLayout>
    <AdminPageHeading eyebrow="STORE PERFORMANCE" title="Reports" description="Live inventory and receiving summaries." action={<span className="report-period-chip">All recorded activity</span>} />
    {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
    <DemoBanner>Inventory, receiving, and completed sales come from the API. Discounts, tax, and payment processor fees are not configured.</DemoBanner>
    <section className="report-metric-grid" aria-label="Inventory report metrics">
      {metrics.map((metric) => <article className="report-metric-card" key={metric.label}><span>{metric.label}</span><strong>{isLoading ? '—' : metric.value}</strong><small>{metric.detail}</small></article>)}
    </section>
    <div className="report-content-grid">
      <section className="catalog-panel admin-ops-panel">
        <div className="catalog-panel-header"><div><h2>Best-selling menu items</h2><p>Units in the most recent 500 saved sales</p></div><span className="admin-panel-icon"><BarChart3 size={17} /></span></div>
        {isLoading ? <p className="catalog-table-footnote">Loading sales...</p> : bestSellers.length === 0 ? <p className="catalog-table-footnote">No completed sales have been recorded yet.</p> : <div className="report-ranking-list">{bestSellers.map((item, index) => <article className="report-ranking-row" key={item.name}><span className="report-rank">{String(index + 1).padStart(2, '0')}</span><div className="report-ranking-copy"><strong>{item.name}</strong><small>{item.quantity} sold</small></div><span className="report-share-label">{item.quantity}</span></article>)}</div>}
        <a className="report-panel-link" href="/cashier/sales">Review saved sales <ArrowUpRight size={14} /></a>
      </section>
      <section className="catalog-panel admin-ops-panel">
        <div className="catalog-panel-header"><div><h2>Ingredient alerts</h2><p>Current stock at or below reorder level</p></div><span className="admin-panel-icon"><ClipboardList size={17} /></span></div>
        {isLoading ? <p className="catalog-table-footnote">Loading inventory...</p> : lowStock.length === 0 ? <p className="catalog-table-footnote">No active ingredients are at or below their reorder levels.</p> : <div className="report-stock-list">{lowStock.map((item) => <article className="report-stock-row" key={item.id}><span><strong>{item.name}</strong><small>{formatQuantity(item.current_quantity, item.base_unit)} {item.base_unit} / reorder at {formatQuantity(item.low_stock_threshold, item.base_unit)} {item.base_unit}</small></span><span className="ops-status ops-status-low">{Number(item.current_quantity) <= 0 ? 'Out of stock' : 'Low stock'}</span></article>)}</div>}
        <a className="report-panel-link" href="/admin/inventory">View ingredient inventory <ArrowUpRight size={14} /></a>
      </section>
    </div>
    <section className="catalog-panel admin-ops-panel report-movement-panel">
      <div className="catalog-panel-header"><div><h2>Stock activity</h2><p>Movement records currently available from the API</p></div><span className="admin-panel-icon"><BarChart3 size={17} /></span></div>
      <div className="report-movement-grid">{movementCounts.map(({ type, count }) => <article className="report-movement-row" key={type}><div><strong>{type.replace('_', ' ')}</strong><span>{isLoading ? '—' : count}</span></div></article>)}</div>
      <div className="catalog-table-scroll"><table className="catalog-table"><thead><tr><th>Reference</th><th>Ingredient</th><th>Movement</th><th>Quantity</th><th>Reason</th><th>Date</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="6">Loading stock activity...</td></tr> : recentMovements.length === 0 ? <tr><td colSpan="6">No stock movements have been recorded.</td></tr> : recentMovements.map((movement) => <tr key={movement.id}><td>{movement.receipt_number || `MOV-${movement.id}`}</td><td>{movement.ingredient_name}</td><td>{movement.movement_type.replace('_', ' ')}</td><td>{Number(movement.quantity_change) > 0 ? '+' : ''}{formatQuantity(movement.quantity_change, movement.base_unit)} {movement.base_unit}</td><td>{movement.reason || '—'}</td><td>{new Date(movement.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
      <p className="catalog-table-footnote">Stock receipt valuation uses the line costs recorded at receiving. It is not a sales or profit figure.</p>
    </section>
  </AdminLayout>
}
