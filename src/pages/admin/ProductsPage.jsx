import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronDown, CirclePlus, Coffee, Minus, Pencil, Plus, Search, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { convertQuantity, convertQuantityToBase, formatQuantity, getCompatibleUnits, isPieceUnit } from '../../utils/measurements.js'

function formatPrice(value, fractionDigits = 2) {
  if (value === null || value === undefined || value === '') return 'Not set'
  const amount = Number(value)
  return Number.isFinite(amount) ? `PHP ${amount.toFixed(fractionDigits)}` : 'Not set'
}

function formatRecipeCost(value, includeCurrency = false) {
  if (value === null || value === undefined || value === '') return 'Not calculated'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Not calculated'
  return includeCurrency ? `PHP ${amount.toFixed(4)}` : amount.toFixed(4)
}

function blankRecipeLine() {
  return { ingredient_id: '', quantity_required: '', unit: '' }
}

function normalizeRecipeLines(lines) {
  return lines
    .filter((line) => line.ingredient_id && line.quantity_required !== '')
    .map((line) => ({
      ingredient_id: Number(line.ingredient_id),
      quantity_required: Number(line.quantity_required),
      unit: line.unit,
    }))
    .sort((left, right) => left.ingredient_id - right.ingredient_id)
}

function sameRecipeLines(left, right) {
  return JSON.stringify(normalizeRecipeLines(left)) === JSON.stringify(normalizeRecipeLines(right))
}

function calculateRecipeCost(lines, averageUnitCosts, ingredients) {
  if (!lines.length || lines.some((line) => !line.ingredient_id || !line.quantity_required || (isPieceUnit(line.unit) && !Number.isInteger(Number(line.quantity_required))))) return null
  let total = 0
  for (const line of lines) {
    const unitCost = averageUnitCosts[Number(line.ingredient_id)]
    const ingredient = ingredients.find((item) => item.id === Number(line.ingredient_id))
    const baseQuantity = convertQuantityToBase(line.quantity_required, line.unit, ingredient?.base_unit)
    if (!Number.isFinite(unitCost) || baseQuantity === null) return null
    total += baseQuantity * unitCost
  }
  return Number.isFinite(total) ? total : null
}

function MenuItemFormDialog({ menuItem, categories, ingredients, averageUnitCosts, recipeLinesByVariant, onClose, onSubmit, isSaving, saveError }) {
  const [variants, setVariants] = useState(() => menuItem?.variants?.map((variant) => {
    const savedLines = recipeLinesByVariant[variant.id] ?? []
    const recipeLines = savedLines.length ? savedLines : [blankRecipeLine()]
    return {
      id: variant.id,
      variant_name: variant.variant_name,
      price: String(variant.price),
      is_active: variant.is_active,
      recipeLines,
      originalRecipeLines: savedLines,
    }
  }) ?? [{ variant_name: '', price: '', is_active: true, recipeLines: [blankRecipeLine()], originalRecipeLines: [] }])
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: menuItem?.name ?? '',
      description: menuItem?.description ?? '',
      category_id: menuItem ? String(menuItem.category_id) : '',
      is_active: menuItem?.is_active ?? true,
    },
  })

  function updateVariant(index, field, value) {
    setVariants((current) => current.map((variant, rowIndex) =>
      rowIndex === index ? { ...variant, [field]: value } : variant,
    ))
  }

  function addVariant() {
    setVariants((current) => [...current, { variant_name: '', price: '', is_active: true, recipeLines: [blankRecipeLine()], originalRecipeLines: [] }])
  }

  function removeVariant(index) {
    const variant = variants[index]
    if (variant.id) {
      updateVariant(index, 'is_active', false)
    } else {
      setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index))
    }
  }

  function updateRecipeIngredient(variantIndex, rowIndex, ingredientId) {
    const ingredient = ingredients.find((item) => item.id === Number(ingredientId))
    setVariants((current) => current.map((variant, index) => index !== variantIndex ? variant : {
      ...variant,
      recipeLines: variant.recipeLines.map((line, lineIndex) => lineIndex !== rowIndex ? line : {
        ...line,
        ingredient_id: ingredientId,
        quantity_required: line.ingredient_id === ingredientId ? line.quantity_required : '',
        unit: ingredient?.base_unit ?? '',
      }),
    }))
  }

  function updateRecipeQuantity(variantIndex, rowIndex, quantity) {
    setVariants((current) => current.map((variant, index) => index !== variantIndex ? variant : {
      ...variant,
      recipeLines: variant.recipeLines.map((line, lineIndex) => lineIndex === rowIndex ? { ...line, quantity_required: quantity } : line),
    }))
  }

  function updateRecipeUnit(variantIndex, rowIndex, unit) {
    setVariants((current) => current.map((variant, index) => {
      if (index !== variantIndex) return variant
      return {
        ...variant,
        recipeLines: variant.recipeLines.map((line, lineIndex) => lineIndex === rowIndex ? {
          ...line,
          quantity_required: line.quantity_required === '' ? '' : String(convertQuantity(line.quantity_required, line.unit, unit) ?? line.quantity_required),
          unit,
        } : line),
      }
    }))
  }

  function addRecipeLine(variantIndex) {
    setVariants((current) => current.map((variant, index) => index === variantIndex
      ? { ...variant, recipeLines: [...variant.recipeLines, blankRecipeLine()] }
      : variant))
  }

  function removeRecipeLine(variantIndex, rowIndex) {
    setVariants((current) => current.map((variant, index) => index !== variantIndex ? variant : {
      ...variant,
      recipeLines: variant.recipeLines.length > 1
        ? variant.recipeLines.filter((_, lineIndex) => lineIndex !== rowIndex)
        : [blankRecipeLine()],
    }))
  }

  const categoryOptions = categories.filter((category) =>
    category.is_active || category.id === menuItem?.category_id,
  )

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <section className="catalog-dialog menu-item-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">COFFEE SHOP MENU</span><h2 id="menu-dialog-title">{menuItem ? 'Edit menu item' : 'Add menu item'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close menu item form"><X size={18} /></button>
        </div>
        <p className="dialog-preview-note">Menu item and variant changes are saved to the POS API.</p>
        <form className="catalog-form" onSubmit={handleSubmit((values) => onSubmit(values, variants))} noValidate>
          <div className="catalog-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-name">Menu item name</label>
              <input id="menu-name" maxLength={450} aria-invalid={Boolean(errors.name)} {...register('name', { required: 'Enter a menu item name.' })} />
              {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
            </div>
            <div className="catalog-field field-span-two">
              <label htmlFor="menu-description">Description <span className="optional-label">Optional</span></label>
              <textarea id="menu-description" rows="2" {...register('description')} />
            </div>
            <div className="catalog-field">
              <label htmlFor="menu-category">Category</label>
              <select id="menu-category" aria-invalid={Boolean(errors.category_id)} {...register('category_id', { required: 'Choose a category.' })}>
                <option value="">Choose a category</option>
                {categoryOptions.map((category) => <option value={category.id} key={category.id}>{category.name}{category.is_active ? '' : ' (inactive)'}</option>)}
              </select>
              {errors.category_id && <span className="field-error" role="alert">{errors.category_id.message}</span>}
            </div>
            {menuItem && (
              <div className="catalog-field">
                <label htmlFor="menu-status">Status</label>
                <select id="menu-status" {...register('is_active', { setValueAs: (value) => value === 'true' })}>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
            )}
          </div>

          <div className="recipe-editor-section">
            <div className="recipe-editor-subhead">
              <div><strong>Serving sizes, recipe cost, and sale price</strong><p className="table-subnote">Enter a size label such as 250 ml, 12 oz, or Large. The cost is calculated from the recipe below.</p></div>
              <button className="catalog-button button-quiet" type="button" onClick={addVariant}>Add variant</button>
            </div>
            {variants.map((variant, index) => (
              <div className="menu-variant-editor" key={variant.id ?? `new-${index}`}>
                <div className="catalog-form-grid">
                  <div className="catalog-field">
                    <label htmlFor={`variant-name-${index}`}>Serving size / variant label</label>
                    <input id={`variant-name-${index}`} value={variant.variant_name} disabled={!variant.is_active} onChange={(event) => updateVariant(index, 'variant_name', event.target.value)} placeholder="e.g. 250 ml, 12 oz, Large" />
                  </div>
                  <div className="catalog-field">
                    <label htmlFor={`variant-cost-${index}`}>Calculated ingredient cost / serving</label>
                    <div className="input-with-prefix"><span>PHP</span><input id={`variant-cost-${index}`} type="text" value={formatRecipeCost(calculateRecipeCost(variant.recipeLines, averageUnitCosts, ingredients))} readOnly /></div>
                  </div>
                  <div className="catalog-field">
                    <label htmlFor={`variant-price-${index}`}>Sale price</label>
                    <div className="input-with-prefix"><span>PHP</span><input id={`variant-price-${index}`} type="number" min="0.01" step="0.01" value={variant.price} disabled={!variant.is_active} onChange={(event) => updateVariant(index, 'price', event.target.value)} placeholder="0.00" /></div>
                  </div>
                  <div className="catalog-field">
                    {variant.id && !variant.is_active ? (
                      <button className="catalog-button button-quiet" type="button" onClick={() => updateVariant(index, 'is_active', true)}>Restore variant</button>
                    ) : (
                      <button className="catalog-button button-quiet" type="button" onClick={() => removeVariant(index)}>{variant.id ? 'Deactivate variant' : 'Remove row'}</button>
                    )}
                  </div>
                </div>
                {variant.is_active && <div className="menu-variant-recipe">
                  <div className="recipe-editor-subhead">
                    <div><strong>Ingredients per serving</strong><small>Use kg/g or L/ml as needed. Piece quantities are whole counts and convert 1-to-1.</small></div>
                    <button className="recipe-add-row" type="button" onClick={() => addRecipeLine(index)} disabled={!ingredients.length}><CirclePlus size={14} aria-hidden="true" /> Add ingredient</button>
                  </div>
                  {ingredients.length === 0 ? <p className="recipe-rule-note">Add an active ingredient before creating a recipe.</p> : variant.recipeLines.map((line, rowIndex) => {
                    const usedIngredientIds = variant.recipeLines.filter((_, candidateIndex) => candidateIndex !== rowIndex).map((item) => Number(item.ingredient_id))
                    return <div className="recipe-line-row" key={`${variant.id ?? `new-${index}`}-recipe-${rowIndex}`}>
                      <select aria-label={`Variant ${index + 1}, ingredient row ${rowIndex + 1}`} value={line.ingredient_id} onChange={(event) => updateRecipeIngredient(index, rowIndex, event.target.value)} disabled={!variant.is_active || isSaving}>
                        <option value="">Choose ingredient</option>
                        {ingredients.filter((ingredient) => (ingredient.is_active || ingredient.id === Number(line.ingredient_id)) && (!usedIngredientIds.includes(ingredient.id) || ingredient.id === Number(line.ingredient_id))).map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}{ingredient.is_active ? '' : ' (inactive)'}</option>)}
                      </select>
                      <input aria-label={`Variant ${index + 1}, quantity for ingredient ${rowIndex + 1}`} type="number" min={isPieceUnit(line.unit) ? '1' : '0.001'} step={isPieceUnit(line.unit) ? '1' : '0.001'} inputMode={isPieceUnit(line.unit) ? 'numeric' : 'decimal'} placeholder="Quantity" value={line.quantity_required} onChange={(event) => updateRecipeQuantity(index, rowIndex, event.target.value)} disabled={!variant.is_active || isSaving} />
                      <select aria-label={`Variant ${index + 1}, unit for ingredient ${rowIndex + 1}`} value={line.unit} onChange={(event) => updateRecipeUnit(index, rowIndex, event.target.value)} disabled={!line.ingredient_id || !variant.is_active || isSaving}>
                        {getCompatibleUnits(ingredients.find((ingredient) => ingredient.id === Number(line.ingredient_id))?.base_unit).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                      </select>
                      <button className="recipe-remove-row" type="button" onClick={() => removeRecipeLine(index, rowIndex)} disabled={isSaving} aria-label={`Remove ingredient ${rowIndex + 1} from variant ${index + 1}`}><X size={14} aria-hidden="true" /></button>
                    </div>
                  })}
                </div>}
              </div>
            ))}
            <p className="catalog-field-hint">The estimate uses weighted average recorded receipt costs for all recipe ingredients. If an ingredient has no recorded cost, its serving cost cannot be calculated. Packaging, waste, labor, and overhead are not included; enter the sale price separately.</p>
          </div>

          {saveError && <p className="field-error" role="alert">{saveError}</p>}
          <div className="dialog-actions">
            <button className="catalog-button button-quiet" type="button" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className="catalog-button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : menuItem ? 'Save menu item' : 'Add menu item'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProductsPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [averageUnitCosts, setAverageUnitCosts] = useState({})
  const [recipeLinesByVariant, setRecipeLinesByVariant] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [pageMessage, setPageMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savingItemId, setSavingItemId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadMenuData() {
    setIsLoading(true)
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoadError('You are not signed in. Please sign in again.')
      setIsLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [itemResponse, categoryResponse, ingredientResponse, receiptResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/admin/menu/items', { headers }),
        fetch('http://127.0.0.1:8000/admin/menu/categories', { headers }),
        fetch('http://127.0.0.1:8000/ingredients', { headers }),
        fetch('http://127.0.0.1:8000/stock-receipts', { headers }),
      ])
      const failed = [itemResponse, categoryResponse, ingredientResponse, receiptResponse].find((response) => !response.ok)
      if (failed) {
        throw new Error(`Could not load menu pricing data (HTTP ${failed.status}).`)
      }
      const [items, categoryData, ingredientData, receipts] = await Promise.all([
        itemResponse.json(), categoryResponse.json(), ingredientResponse.json(), receiptResponse.json(),
      ])
      const receiptTotals = {}
      for (const receipt of receipts) {
        if (receipt.status !== 'received') continue
        for (const line of receipt.items) {
          const quantity = Number(line.quantity_received)
          const unitCost = Number(line.unit_cost)
          if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) continue
          const current = receiptTotals[line.ingredient_id] ?? { quantity: 0, totalCost: 0 }
          current.quantity += quantity
          current.totalCost += quantity * unitCost
          receiptTotals[line.ingredient_id] = current
        }
      }
      const costMap = Object.fromEntries(Object.entries(receiptTotals).map(([ingredientId, totals]) => [
        ingredientId,
        totals.quantity > 0 ? totals.totalCost / totals.quantity : NaN,
      ]))

      const recipeEntries = await Promise.all(items.flatMap((item) => item.variants.map(async (variant) => {
        const response = await fetch(`http://127.0.0.1:8000/menu/variants/${variant.id}/recipe-versions`, { headers })
        if (!response.ok) throw new Error(`Could not load recipe for ${item.name} - ${variant.variant_name} (HTTP ${response.status}).`)
        const versions = await response.json()
        const currentVersions = versions.filter((recipe) => new Date(recipe.effective_from) <= new Date())
        currentVersions.sort((left, right) => new Date(right.effective_from) - new Date(left.effective_from) || right.version_number - left.version_number)
        const currentRecipe = currentVersions[0]
        return [variant.id, currentRecipe?.ingredients.map((line) => ({
          ingredient_id: String(line.ingredient_id),
          quantity_required: String(line.quantity_required),
          unit: line.unit,
        })) ?? []]
      })))

      setMenuItems(items)
      setCategories(categoryData)
      setIngredients(ingredientData)
      setAverageUnitCosts(costMap)
      setRecipeLinesByVariant(Object.fromEntries(recipeEntries))
      setLoadError('')
    } catch (error) {
      setLoadError(error.message || 'Could not load menu data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadMenuData() }, [])

  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const matchesSearch = `${item.name} ${item.description ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || String(item.category_id) === categoryFilter
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? item.is_active : !item.is_active)
    return matchesSearch && matchesCategory && matchesStatus
  }), [menuItems, searchTerm, categoryFilter, statusFilter])

  function openForm(menuItem = null) {
    setSaveError('')
    setPageMessage('')
    setActiveMenuItem(menuItem)
    setIsFormOpen(true)
  }

  async function saveMenuItem(formValues, variants) {
    setSaveError('')
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setSaveError('Your session has expired. Sign in again.')
      return
    }
    const activeVariants = variants.filter((variant) => variant.is_active)
    if (!activeVariants.length) {
      setSaveError('Keep at least one active variant and sale price for this menu item.')
      return
    }
    if (activeVariants.some((variant) => !variant.variant_name.trim() || variant.price === '' || !Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0)) {
      setSaveError('Enter a serving size or variant label and a sale price greater than zero for every active variant.')
      return
    }
    for (const variant of activeVariants) {
      if (variant.recipeLines.some((line) => line.ingredient_id && isPieceUnit(line.unit) && !Number.isInteger(Number(line.quantity_required)))) {
        setSaveError(`The recipe for "${variant.variant_name}" has a fractional piece count. Update it to a whole number before saving.`)
        return
      }
      const changedRecipe = !sameRecipeLines(variant.recipeLines, variant.originalRecipeLines ?? [])
      const needsRecipe = !activeMenuItem || !variant.id || changedRecipe
      if (!needsRecipe) continue
      if (!variant.recipeLines.length || variant.recipeLines.some((line) => !line.ingredient_id || !line.quantity_required || !Number.isFinite(Number(line.quantity_required)) || Number(line.quantity_required) <= 0 || (isPieceUnit(line.unit) && !Number.isInteger(Number(line.quantity_required))))) {
        setSaveError(`Enter a valid quantity for every ingredient in "${variant.variant_name}". Piece quantities must be whole numbers.`)
        return
      }
      if (new Set(variant.recipeLines.map((line) => Number(line.ingredient_id))).size !== variant.recipeLines.length) {
        setSaveError(`Each ingredient can only appear once in "${variant.variant_name}".`)
        return
      }
    }
    setIsSaving(true)
    let itemWasSaved = false
    try {
      const itemPayload = {
        name: formValues.name.trim(),
        description: formValues.description.trim() || null,
        category_id: Number(formValues.category_id),
      }
      if (activeMenuItem) itemPayload.is_active = formValues.is_active
      const itemResponse = await fetch(
        activeMenuItem
          ? `http://127.0.0.1:8000/menu/items/${activeMenuItem.id}`
          : 'http://127.0.0.1:8000/menu/items',
        {
          method: activeMenuItem ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(activeMenuItem ? itemPayload : {
            ...itemPayload,
            variants: activeVariants.filter((variant) => !variant.id).map((variant) => ({
              variant_name: variant.variant_name.trim(),
              price: variant.price,
            })),
          }),
        },
      )
      if (!itemResponse.ok) {
        const data = await itemResponse.json().catch(() => null)
        throw new Error(data?.detail || `Could not save menu item (HTTP ${itemResponse.status}).`)
      }

      const savedItem = await itemResponse.json()
      itemWasSaved = true
      const savedVariantIds = new Map()
      if (activeMenuItem) {
        for (const variant of variants) {
          if (!variant.id && variant.variant_name.trim() && variant.price !== '') {
            const response = await fetch(`http://127.0.0.1:8000/menu/items/${savedItem.id}/variants`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ variant_name: variant.variant_name.trim(), price: variant.price }),
            })
            if (!response.ok) {
              const data = await response.json().catch(() => null)
              throw new Error(data?.detail || `Menu item saved, but could not add a variant (HTTP ${response.status}).`)
            }
            const newVariant = await response.json()
            savedVariantIds.set(variant, newVariant.id)
          } else if (variant.id) {
            const response = await fetch(`http://127.0.0.1:8000/menu/variants/${variant.id}`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                variant_name: variant.variant_name,
                price: variant.price,
                is_active: variant.is_active,
              }),
            })
            if (!response.ok) {
              const data = await response.json().catch(() => null)
              throw new Error(data?.detail || `Menu item saved, but could not update a variant (HTTP ${response.status}).`)
            }
            savedVariantIds.set(variant, variant.id)
          }
        }
      } else {
        activeVariants.forEach((variant, index) => savedVariantIds.set(variant, savedItem.variants[index]?.id))
      }

      for (const variant of activeVariants) {
        const changedRecipe = !sameRecipeLines(variant.recipeLines, variant.originalRecipeLines ?? [])
        if (activeMenuItem && variant.id && !changedRecipe) continue
        const menuVariantId = savedVariantIds.get(variant)
        if (!menuVariantId) throw new Error(`Menu item saved, but the variant ID for "${variant.variant_name}" was not returned.`)
        const recipeResponse = await fetch(`http://127.0.0.1:8000/menu/variants/${menuVariantId}/recipe-versions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: variant.recipeLines.map((line) => ({
              ingredient_id: Number(line.ingredient_id),
              quantity_required: line.quantity_required,
              unit: line.unit,
            })),
          }),
        })
        if (!recipeResponse.ok) {
          const data = await recipeResponse.json().catch(() => null)
          const detail = Array.isArray(data?.detail) ? data.detail.map((entry) => entry.msg).join(' ') : data?.detail
          throw new Error(detail || `Menu item saved, but the recipe for "${variant.variant_name}" could not be saved (HTTP ${recipeResponse.status}).`)
        }
      }
      await loadMenuData()
      setIsFormOpen(false)
      setActiveMenuItem(null)
      setPageMessage('Menu item, variants, and recipe changes saved.')
    } catch (error) {
      const message = error.message || 'Could not save menu item.'
      if (itemWasSaved) {
        // Item, variant, and recipe writes are separate API calls; close the form to avoid
        // resubmitting already-created rows if a later request failed.
        setIsFormOpen(false)
        setActiveMenuItem(null)
        setPageMessage(message)
        await loadMenuData()
      } else {
        setSaveError(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleMenuItem(item) {
    setSavingItemId(item.id)
    setPageMessage('')
    const token = sessionStorage.getItem('access_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Could not update availability (HTTP ${response.status}).`)
      }
      const updated = await response.json()
      setMenuItems((current) => current.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry))
      setPageMessage(`${item.name} is now ${updated.is_active ? 'available' : 'unavailable'}.`)
    } catch (error) {
      setLoadError(error.message || 'Could not update menu item availability.')
    } finally {
      setSavingItemId(null)
    }
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]))

  return (
    <AdminLayout>
      <div className="catalog-page-heading">
        <div><span className="eyebrow">COFFEE SHOP MENU</span><h1>Menu items</h1><p>Manage menu items, prices, variants, and availability.</p></div>
        <button className="catalog-button button-primary" type="button" onClick={() => openForm()}><CirclePlus size={16} aria-hidden="true" /> Add menu item</button>
      </div>
      {loadError && <div className="demo-data-banner" role="alert">{loadError}</div>}
      {pageMessage && <p className="inventory-success-message" role="status">{pageMessage}</p>}

      <section className="catalog-panel">
        <div className="catalog-panel-header">
          <div><h2>Menu</h2><p>{isLoading ? 'Loading menu...' : `${menuItems.length} menu items`}</p></div>
          <a className="catalog-switch-link" href="/admin/categories"><Coffee size={15} aria-hidden="true" /> Manage categories</a>
        </div>
        <div className="catalog-toolbar">
          <label className="catalog-search" htmlFor="menu-search"><Search size={16} aria-hidden="true" /><input id="menu-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search menu items" /></label>
          <label className="catalog-select-wrap" htmlFor="menu-category-filter"><select id="menu-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></label>
          <label className="catalog-select-wrap" htmlFor="menu-availability-filter"><select id="menu-availability-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Available</option><option value="inactive">Unavailable</option></select><ChevronDown size={14} aria-hidden="true" /></label>
        </div>
        <div className="catalog-table-scroll">
          <table className="catalog-table menu-table">
            <thead><tr><th>Menu item</th><th>Category</th><th>Variant cost / sale price</th><th>Starting sale price</th><th>Availability</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan="6">Loading menu items...</td></tr> : visibleItems.length === 0 ? <tr><td colSpan="6">No menu items match this view.</td></tr> : visibleItems.map((item) => {
                const activeVariants = item.variants.filter((variant) => variant.is_active)
                const validPrices = activeVariants.map((variant) => Number(variant.price)).filter((price) => Number.isFinite(price) && price > 0)
                const startingPrice = validPrices.length ? Math.min(...validPrices) : null
                return (
                  <tr key={item.id}>
                    <td><span className="catalog-product-cell"><span className="catalog-product-icon"><Coffee size={16} aria-hidden="true" /></span><span className="menu-item-cell"><strong>{item.name}</strong><small>#{item.id} | {item.description || 'No description'}</small></span></span></td>
                    <td>{categoryNames.get(item.category_id) || 'Unknown category'}</td>
                    <td>{activeVariants.length ? activeVariants.map((variant) => {
                      const recipeLines = recipeLinesByVariant[variant.id] ?? []
                      const recipeSummary = recipeLines.map((line) => `${ingredientNames.get(Number(line.ingredient_id)) || `Ingredient #${line.ingredient_id}`}: ${formatQuantity(line.quantity_required, line.unit)} ${line.unit}`).join(', ')
                      return <div key={variant.id}>{variant.variant_name}<small className="variant-cost-sale-line">Cost: {formatRecipeCost(variant.recipe_cost, true)} · Sale: {formatPrice(variant.price)}</small><small className="variant-recipe-summary">{recipeSummary ? `Recipe: ${recipeSummary}` : 'Recipe: not set'}</small></div>
                    }) : 'No active variants'}</td>
                    <td className="catalog-price-cell">{startingPrice === null ? 'Not set' : formatPrice(startingPrice)}</td>
                    <td><span className={`catalog-status ${item.is_active ? 'status-active' : 'status-inactive'}`}><span />{item.is_active ? 'Available' : 'Unavailable'}</span></td>
                    <td><div className="catalog-row-actions"><button type="button" className="row-action-button" onClick={() => openForm(item)} aria-label={`Edit ${item.name}`}><Pencil size={15} aria-hidden="true" /></button><button type="button" className="row-action-button" disabled={savingItemId !== null} onClick={() => toggleMenuItem(item)} aria-label={`${item.is_active ? 'Make unavailable' : 'Make available'} ${item.name}`}>{savingItemId === item.id ? '...' : item.is_active ? <Minus size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}</button></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">Modifier groups are not yet modeled by the backend. Variant prices and availability are API-backed.</p>
      </section>

      {isFormOpen && <MenuItemFormDialog key={activeMenuItem?.id ?? 'new-menu-item'} menuItem={activeMenuItem} categories={categories} ingredients={ingredients.filter((ingredient) => ingredient.is_active || Object.values(recipeLinesByVariant).some((lines) => lines.some((line) => Number(line.ingredient_id) === ingredient.id)))} averageUnitCosts={averageUnitCosts} recipeLinesByVariant={recipeLinesByVariant} onClose={() => { setIsFormOpen(false); setActiveMenuItem(null) }} onSubmit={saveMenuItem} isSaving={isSaving} saveError={saveError} />}
    </AdminLayout>
  )
}

export default ProductsPage
