import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDownRight, ArrowUpRight, ClipboardList, Package, Plus, Scale, SlidersHorizontal, Trash2, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoUnitGuides } from '../../data/demoInventoryData.js'
import { formatQuantity, getCompatibleUnits, isPieceUnit } from '../../utils/measurements.js'

function InventoryActionDialog({
  actionType,
  onClose,
  onSubmit,
  ingredients,
  ingredientsLoading,
  ingredientsError,
  suppliers,
  suppliersLoading,
  suppliersError,
  receiptSaveError,
  movementSaveError,
}) {
  const isReceiving = actionType === 'receiving'
  const isWaste = actionType === 'waste'
  const activeIngredients = ingredients.filter((item) => item.is_active)
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      ingredientId: '',
      quantity: '',
      supplierId: '',
      supplierInvoiceNumber: '',
      receivedUnit: '',
      unitCost: '',
      reason: '',
      note: '',
    },
  })

  const selectedIngredientId = watch('ingredientId')
  const selectedReceivedUnit = watch('receivedUnit')
  const enteredQuantity = watch('quantity')
  const enteredUnitCost = watch('unitCost')
  const selectedIngredient = activeIngredients.find(
    (item) => String(item.id) === String(selectedIngredientId),
  )

  const ingredientField = register('ingredientId', {
    required: 'Choose an ingredient.',
  })

  const title = isReceiving
    ? 'Receive stock'
    : isWaste
      ? 'Record waste or spoilage'
      : 'Adjust stock'
  const wholePieceQuantity = isPieceUnit(selectedIngredient?.base_unit)
  const estimatedReceiptTotal = Number(enteredQuantity) * Number(enteredUnitCost)

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="catalog-dialog inventory-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">INGREDIENT INVENTORY</span>
            <h2 id="inventory-dialog-title">{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close inventory form"
          >
            <X size={18} />
          </button>
        </div>

        <p className="dialog-preview-note">
          {isReceiving
            ? 'The receipt number is assigned by the system when this receipt is saved.'
            : isWaste
              ? 'Waste is removed from on-hand stock and cannot exceed the available quantity.'
              : 'Enter the physically counted on-hand quantity; the API records the difference.'}
        </p>
        {isReceiving && receiptSaveError && (
          <p className="field-error" role="alert">
            {receiptSaveError}
          </p>
        )}
        {!isReceiving && movementSaveError && (
          <p className="field-error" role="alert">
            {movementSaveError}
          </p>
        )}

        <form
          className="catalog-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="catalog-form-grid category-form-grid">
            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-ingredient">Ingredient</label>
              <select
                id="inventory-ingredient"
                aria-invalid={Boolean(errors.ingredientId)}
                {...ingredientField}
                onChange={(event) => {
                  ingredientField.onChange(event)
                  const chosenIngredient = activeIngredients.find(
                    (item) => String(item.id) === event.target.value,
                  )
                  setValue(
                    'receivedUnit',
                    chosenIngredient?.base_unit ?? '',
                    { shouldValidate: true },
                  )
                  setValue('quantity', '', { shouldValidate: false })
                  if (isReceiving) setValue('unitCost', '', { shouldValidate: false })
                }}
              >
                <option value="">
                  {ingredientsLoading ? 'Loading ingredients...' : 'Choose an ingredient'}
                </option>
                {activeIngredients.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} ({item.base_unit})
                  </option>
                ))}
              </select>
              {errors.ingredientId && (
                <span className="field-error" role="alert">
                  {errors.ingredientId.message}
                </span>
              )}
              {ingredientsError && (
                <span className="field-error" role="alert">
                  {ingredientsError}
                </span>
              )}
            </div>

            {isReceiving && (
              <>
                <div className="catalog-field field-span-two">
                  <label htmlFor="inventory-supplier">Supplier</label>
                  <select
                    id="inventory-supplier"
                    aria-invalid={Boolean(errors.supplierId)}
                    {...register('supplierId', {
                      required: 'Choose a supplier.',
                    })}
                  >
                    <option value="">
                      {suppliersLoading ? 'Loading suppliers...' : 'Choose a supplier'}
                    </option>
                    {activeSuppliers.map((supplier) => (
                      <option value={supplier.id} key={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <span className="field-error" role="alert">
                      {errors.supplierId.message}
                    </span>
                  )}
                  {suppliersError && (
                    <span className="field-error" role="alert">
                      {suppliersError}
                    </span>
                  )}
                </div>

                <div className="catalog-field">
                  <label htmlFor="inventory-receipt-number">Receipt number</label>
                  <input
                    id="inventory-receipt-number"
                    type="text"
                    value="Generated automatically when saved"
                    disabled
                  />
                  <span className="catalog-field-hint">
                    The system assigns the receipt number after saving.
                  </span>
                </div>

                <div className="catalog-field">
                  <label htmlFor="inventory-invoice-number">
                    Supplier invoice number <span className="optional-label">Optional</span>
                  </label>
                  <input
                    id="inventory-invoice-number"
                    {...register('supplierInvoiceNumber')}
                  />
                </div>
              </>
            )}

            <div className="catalog-field">
              <label htmlFor="inventory-quantity">
                {isReceiving
                  ? wholePieceQuantity ? 'Quantity received (whole pieces)' : 'Quantity received'
                  : isWaste
                    ? wholePieceQuantity ? 'Quantity wasted (whole pieces)' : 'Quantity wasted'
                  : wholePieceQuantity ? 'Counted on-hand quantity (whole pieces)' : 'Counted on-hand quantity'}
              </label>
              <input
                id="inventory-quantity"
                type="number"
                inputMode={wholePieceQuantity ? 'numeric' : 'decimal'}
                min={isReceiving || isWaste ? wholePieceQuantity ? '1' : '0.001' : '0'}
                step={wholePieceQuantity ? '1' : '0.001'}
                placeholder={isWaste ? 'Enter amount wasted' : isReceiving ? 'Enter quantity received' : 'Enter physical count'}
                aria-invalid={Boolean(errors.quantity)}
                {...register('quantity', {
                  required: 'Enter a quantity.',
                  min: {
                    value: isReceiving || isWaste ? wholePieceQuantity ? 1 : 0.001 : 0,
                    message: isReceiving || isWaste
                      ? 'Quantity must be greater than zero.'
                      : 'Count cannot be negative.',
                  },
                  validate: (value) => !wholePieceQuantity || Number.isInteger(Number(value)) || 'Piece quantities must be whole numbers.',
                })}
              />
              {errors.quantity && (
                <span className="field-error" role="alert">
                  {errors.quantity.message}
                </span>
              )}
            </div>

            {isReceiving && (
              <>
                <div className="catalog-field">
                  <label htmlFor="inventory-received-unit">Received unit</label>
                  <select
                    id="inventory-received-unit"
                    aria-describedby="inventory-unit-hint"
                    disabled={!selectedIngredient}
                    {...register('receivedUnit', { required: 'Choose a unit.' })}
                  >
                    <option value="">Choose unit</option>
                    {getCompatibleUnits(selectedIngredient?.base_unit).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <span className="catalog-field-hint" id="inventory-unit-hint">
                    Quantity and cost are converted to the ingredient base unit; piece counts stay 1-to-1.
                  </span>
                </div>

                <div className="catalog-field field-span-two">
                  <label htmlFor="inventory-unit-cost">Cost per {selectedReceivedUnit || 'unit'}</label>
                  <input
                    id="inventory-unit-cost"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={isPieceUnit(selectedReceivedUnit) ? '0.01' : '0.0001'}
                    placeholder={`Enter price for 1 ${selectedReceivedUnit || 'unit'}`}
                    aria-invalid={Boolean(errors.unitCost)}
                    {...register('unitCost', {
                      required: 'Enter the unit cost.',
                      min: { value: 0, message: 'Unit cost cannot be negative.' },
                      validate: (value) => !isPieceUnit(selectedReceivedUnit) || Number(value) === Math.round(Number(value) * 100) / 100 || 'Cost per piece must be entered in cents, such as 1.00.',
                    })}
                  />
                  {errors.unitCost && (
                    <span className="field-error" role="alert">
                      {errors.unitCost.message}
                    </span>
                  )}
                  {Number.isFinite(estimatedReceiptTotal) && enteredQuantity !== '' && enteredUnitCost !== '' && <span className="catalog-field-hint">Receipt line total: PHP {estimatedReceiptTotal.toFixed(2)} ({enteredQuantity} {selectedReceivedUnit} x PHP {enteredUnitCost} per {selectedReceivedUnit})</span>}
                </div>
              </>
            )}

            {!isReceiving && (
              <div className="catalog-field field-span-two">
                <label htmlFor="inventory-reason">Reason</label>
                <select
                  id="inventory-reason"
                  aria-invalid={Boolean(errors.reason)}
                  {...register('reason', { required: 'Choose a reason.' })}
                >
                  <option value="">Choose a reason</option>
                  {isWaste ? (
                    <>
                      <option>Spill</option>
                      <option>Spoilage</option>
                      <option>Damaged stock</option>
                      <option>Other</option>
                    </>
                  ) : (
                    <>
                      <option>Count correction</option>
                      <option>Damaged or lost</option>
                      <option>Other</option>
                    </>
                  )}
                </select>
                {errors.reason && (
                  <span className="field-error" role="alert">
                    {errors.reason.message}
                  </span>
                )}
              </div>
            )}

            <div className="catalog-field field-span-two">
              <label htmlFor="inventory-note">
                Note <span className="optional-label">Optional</span>
              </label>
              <textarea
                id="inventory-note"
                rows="3"
                placeholder="Add a note"
                {...register('note')}
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button
              className="catalog-button button-quiet"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="catalog-button button-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isReceiving
                ? isSubmitting ? 'Saving receipt...' : 'Record receipt'
                : isSubmitting
                  ? 'Saving...'
                  : isWaste
                    ? 'Record waste'
                    : 'Save adjustment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Creates an ingredient through the API; new ingredients begin with zero stock.
function IngredientCreateDialog({ onClose, onCreated }) {
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      base_unit: '',
      low_stock_threshold: '0',
    },
  })
  const baseUnit = watch('base_unit')
  const wholePieceThreshold = isPieceUnit(baseUnit)

  // Sends the validated ingredient details to the Admin-only create endpoint.
  async function createIngredient(formValues) {
    setSaveError('')

    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setSaveError('Your session has expired. Sign in again.')
      return
    }

    setIsSaving(true)
    let createdIngredient = null

    try {
      const response = await fetch('http://127.0.0.1:8000/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formValues.name.trim(),
          base_unit: formValues.base_unit.trim(),
          low_stock_threshold: formValues.low_stock_threshold,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = errorData?.detail
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail

        throw new Error(message || `Could not create ingredient (HTTP ${response.status}).`)
      }

      createdIngredient = await response.json()
    } catch (error) {
      setSaveError(error.message || 'Could not create ingredient.')
    } finally {
      setIsSaving(false)
    }

    if (createdIngredient) {
      onCreated(createdIngredient)
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
        className="catalog-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-create-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">INGREDIENT INVENTORY</span>
            <h2 id="ingredient-create-title">Add ingredient</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close add ingredient form"
          >
            <X size={18} />
          </button>
        </div>

        <p className="dialog-preview-note">
          New ingredients start with zero stock. Record a stock receipt to add quantity.
        </p>

        <form className="catalog-form" onSubmit={handleSubmit(createIngredient)}>
          <div className="catalog-field">
            <label htmlFor="new-ingredient-name">Ingredient name</label>
            <input
              id="new-ingredient-name"
              type="text"
              maxLength={155}
              required
              aria-invalid={Boolean(errors.name)}
              {...register('name', {
                required: 'Enter an ingredient name.',
                maxLength: {
                  value: 155,
                  message: 'Name must be 155 characters or fewer.',
                },
              })}
            />
            {errors.name && (
              <span className="field-error" role="alert">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="catalog-field">
            <label htmlFor="new-ingredient-unit">Base unit</label>
            <input
              id="new-ingredient-unit"
              type="text"
              maxLength={155}
              placeholder="e.g. kg, ml, pcs"
              required
              aria-invalid={Boolean(errors.base_unit)}
              {...register('base_unit', {
                required: 'Enter the ingredient base unit.',
                maxLength: {
                  value: 155,
                  message: 'Unit must be 155 characters or fewer.',
                },
              })}
            />
            {errors.base_unit && (
              <span className="field-error" role="alert">
                {errors.base_unit.message}
              </span>
            )}
          </div>

          <div className="catalog-field">
            <label htmlFor="new-ingredient-threshold">Low-stock threshold</label>
            <input
              id="new-ingredient-threshold"
              type="number"
              min="0"
              step={wholePieceThreshold ? '1' : '0.001'}
              inputMode={wholePieceThreshold ? 'numeric' : 'decimal'}
              required
              aria-invalid={Boolean(errors.low_stock_threshold)}
              {...register('low_stock_threshold', {
                required: 'Enter a low-stock threshold.',
                min: {
                  value: 0,
                  message: 'Threshold cannot be negative.',
                },
                validate: (value) => !wholePieceThreshold || Number.isInteger(Number(value)) || 'Piece thresholds must be whole numbers.',
              })}
            />
            {errors.low_stock_threshold && (
              <span className="field-error" role="alert">
                {errors.low_stock_threshold.message}
              </span>
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
              Cancel
            </button>
            <button
              className="catalog-button button-primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Create ingredient'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Updates an ingredient's editable details through the Admin-only PATCH endpoint.
function IngredientEditDialog({ ingredient, onClose, onUpdated }) {
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: ingredient.name,
      low_stock_threshold: String(ingredient.low_stock_threshold),
    },
  })

  async function updateIngredient(formValues) {
    setSaveError('')
    const token = sessionStorage.getItem('access_token')

    if (!token) {
      setSaveError('Your session has expired. Sign in again.')
      return
    }

    setIsSaving(true)
    let updatedIngredient = null

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ingredients/${ingredient.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formValues.name.trim(),
            low_stock_threshold: formValues.low_stock_threshold,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = errorData?.detail
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail

        throw new Error(message || `Could not update ingredient (HTTP ${response.status}).`)
      }

      updatedIngredient = await response.json()
    } catch (error) {
      setSaveError(error.message || 'Could not update ingredient.')
    } finally {
      setIsSaving(false)
    }

    if (updatedIngredient) {
      onUpdated(updatedIngredient)
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
        className="catalog-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-edit-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">INGREDIENT INVENTORY</span>
            <h2 id="ingredient-edit-title">Edit ingredient</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close edit ingredient form"
          >
            <X size={18} />
          </button>
        </div>

        <form className="catalog-form" onSubmit={handleSubmit(updateIngredient)}>
          <div className="catalog-field">
            <label htmlFor="edit-ingredient-name">Ingredient name</label>
            <input
              id="edit-ingredient-name"
              type="text"
              maxLength={155}
              required
              {...register('name', {
                required: 'Enter an ingredient name.',
                maxLength: {
                  value: 155,
                  message: 'Name must be 155 characters or fewer.',
                },
              })}
            />
            {errors.name && (
              <span className="field-error" role="alert">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="catalog-field">
            <label>Base unit</label>
            <input value={ingredient.base_unit} readOnly />
            <span className="catalog-field-hint">
              Base units are kept unchanged to preserve recipe and stock history.
            </span>
          </div>

          <div className="catalog-field">
            <label htmlFor="edit-ingredient-threshold">Low-stock threshold</label>
            <input
              id="edit-ingredient-threshold"
              type="number"
              min="0"
              step={isPieceUnit(ingredient.base_unit) ? '1' : '0.001'}
              inputMode={isPieceUnit(ingredient.base_unit) ? 'numeric' : 'decimal'}
              required
              {...register('low_stock_threshold', {
                required: 'Enter a low-stock threshold.',
                min: {
                  value: 0,
                  message: 'Threshold cannot be negative.',
                },
                validate: (value) => !isPieceUnit(ingredient.base_unit) || Number.isInteger(Number(value)) || 'Piece thresholds must be whole numbers.',
              })}
            />
            {errors.low_stock_threshold && (
              <span className="field-error" role="alert">
                {errors.low_stock_threshold.message}
              </span>
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
              Cancel
            </button>
            <button
              className="catalog-button button-primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InventoryPage() {
  // State declarations for the Inventory page go here.
  const [activeAction, setActiveAction] = useState(null)

  const [ingredients, setIngredients] = useState([])
  const [ingredientsLoading, setIngredientsLoading] = useState(true)
  const [ingredientsError, setIngredientsError] = useState('')
  const [ingredientCreateOpen, setIngredientCreateOpen] = useState(false)
  const [ingredientToEdit, setIngredientToEdit] = useState(null)
  const [deactivatingIngredientId, setDeactivatingIngredientId] = useState(null)
  const [reactivatingIngredientId, setReactivatingIngredientId] = useState(null)
  const [ingredientActionError, setIngredientActionError] = useState('')
  const [ingredientToDeactivate, setIngredientToDeactivate] = useState(null)

  const [suppliers, setSuppliers] = useState([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [suppliersError, setSuppliersError] = useState('')
  const [receiptSaveError, setReceiptSaveError] = useState('')
  const [receiptSaveSuccess, setReceiptSaveSuccess] = useState('')
  const [movementSaveError, setMovementSaveError] = useState('')
  const [movementSaveSuccess, setMovementSaveSuccess] = useState('')
  const [stockMovements, setStockMovements] = useState([])
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [movementsError, setMovementsError] = useState('')

  // Load real ingredient records for the inventory table.
  useEffect(() => {
    let isMounted = true

    async function loadIngredients() {
      const token = sessionStorage.getItem('access_token')

      if (!token) {
        setIngredientsError('You are not signed in. Please sign in again.')
        setIngredientsLoading(false)
        return
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/ingredients', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Could not load ingredients (HTTP ${response.status}).`)
        }

        const data = await response.json()

        if (isMounted) {
          setIngredients(data)
          setIngredientsError('')
        }
      } catch (error) {
        if (isMounted) {
          setIngredientsError(error.message || 'Could not load ingredients.')
        }
      } finally {
        if (isMounted) {
          setIngredientsLoading(false)
        }
      }
    }

    loadIngredients()

    return () => {
      isMounted = false
    }
  }, [])

  // Load suppliers so the receipt form can offer active suppliers from the API.
useEffect(() => {
  let isMounted = true

  async function loadSuppliers() {
    const token = sessionStorage.getItem('access_token')

    if (!token) {
      setSuppliersError('You are not signed in. Please sign in again.')
      setSuppliersLoading(false)
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/suppliers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Could not load suppliers (HTTP ${response.status}).`)
      }

      const data = await response.json()

      if (isMounted) {
        setSuppliers(data)
        setSuppliersError('')
      }
    } catch (error) {
      if (isMounted) {
        setSuppliersError(error.message || 'Could not load suppliers.')
      }
    } finally {
      if (isMounted) {
        setSuppliersLoading(false)
      }
    }
  }

  loadSuppliers()

  return () => {
    isMounted = false
  }
}, [])

  // Load the API-backed movement ledger shown below the inventory table.
  useEffect(() => {
    let isMounted = true

    async function loadMovements() {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        setMovementsError('You are not signed in. Please sign in again.')
        setMovementsLoading(false)
        return
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/stock-movements', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          throw new Error(`Could not load stock movements (HTTP ${response.status}).`)
        }
        const data = await response.json()
        if (isMounted) {
          setStockMovements(data)
          setMovementsError('')
        }
      } catch (error) {
        if (isMounted) {
          setMovementsError(error.message || 'Could not load stock movements.')
        }
      } finally {
        if (isMounted) setMovementsLoading(false)
      }
    }

    loadMovements()
    return () => {
      isMounted = false
    }
  }, [])

  // Reload both API-backed inventory lists after a stock-changing operation.
  async function refreshInventoryData(token) {
    const [ingredientsResponse, movementsResponse] = await Promise.all([
      fetch('http://127.0.0.1:8000/ingredients', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch('http://127.0.0.1:8000/stock-movements', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    if (!ingredientsResponse.ok || !movementsResponse.ok) {
      throw new Error('Stock was saved, but the inventory lists could not be refreshed.')
    }

    const [ingredientData, movementData] = await Promise.all([
      ingredientsResponse.json(),
      movementsResponse.json(),
    ])
    setIngredients(ingredientData)
    setStockMovements(movementData)
    setIngredientsError('')
    setMovementsError('')
    setIngredientsLoading(false)
    setMovementsLoading(false)
  }

  // Saves one ingredient receipt through the API and refreshes on-hand inventory.
  async function handleReceiving(formValues) {
    setReceiptSaveError('')
    setReceiptSaveSuccess('')

    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setReceiptSaveError('Your session has expired. Sign in again.')
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/stock-receipts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_id: Number(formValues.supplierId),
          supplier_invoice_number: formValues.supplierInvoiceNumber.trim() || null,
          notes: formValues.note.trim() || null,
          items: [
            {
              ingredient_id: Number(formValues.ingredientId),
              quantity_received: formValues.quantity,
              received_unit: formValues.receivedUnit,
              unit_cost: formValues.unitCost,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = errorData?.detail
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail

        throw new Error(message || `Could not save receipt (HTTP ${response.status}).`)
      }

      const savedReceipt = await response.json()
      let refreshNote = ''

      try {
        await refreshInventoryData(token)
      } catch {
        refreshNote = ' Reload the page to refresh inventory and movement history.'
      }

      setReceiptSaveSuccess({
        receiptNumber: savedReceipt.receipt_number,
        refreshNote,
      })
      setActiveAction(null)
    } catch (error) {
      setReceiptSaveError(error.message || 'Could not save receipt.')
    }
  }

  // Saves a physical stock count; the backend calculates and records its delta.
  async function handleStockAdjustment(formValues) {
    await saveStockChange('/stock-adjustments', {
      ingredient_id: Number(formValues.ingredientId),
      counted_quantity: formValues.quantity,
      reason: formValues.reason,
      notes: formValues.note.trim() || null,
    }, 'Stock count adjustment saved.')
  }

  // Records waste as a decrease in stock; the API prevents quantities below zero.
  async function handleWaste(formValues) {
    await saveStockChange('/stock-waste', {
      ingredient_id: Number(formValues.ingredientId),
      quantity_wasted: formValues.quantity,
      reason: formValues.reason,
      notes: formValues.note.trim() || null,
    }, 'Waste was recorded.')
  }

  // Posts an adjustment or waste movement, then reloads stock and ledger data.
  async function saveStockChange(endpoint, payload, successMessage) {
    setMovementSaveError('')
    setMovementSaveSuccess('')

    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setMovementSaveError('Your session has expired. Sign in again.')
      return
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = errorData?.detail
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail
        throw new Error(message || `Could not save stock movement (HTTP ${response.status}).`)
      }

      await response.json()
      let refreshNote = ''
      try {
        await refreshInventoryData(token)
      } catch {
        refreshNote = ' Reload the page to refresh inventory and movement history.'
      }

      setMovementSaveSuccess(`${successMessage}${refreshNote}`)
      setActiveAction(null)
    } catch (error) {
      setMovementSaveError(error.message || 'Could not save stock movement.')
    }
  }

  function closeInventoryDialog() {
    setActiveAction(null)
  }
// Deactivates an ingredient through the API while preserving its stock and history.
async function deactivateIngredient(ingredient) {
  setIngredientActionError('')

  const token = sessionStorage.getItem('access_token')
  if (!token) {
    setIngredientActionError('Your session has expired. Sign in again.')
    return
  }

  setDeactivatingIngredientId(ingredient.id)
  let updatedIngredient = null

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/ingredients/${ingredient.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const detail = errorData?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(' ')
        : detail

      throw new Error(message || `Could not deactivate ingredient (HTTP ${response.status}).`)
    }

    updatedIngredient = await response.json()

    setIngredients((currentIngredients) =>
      currentIngredients.map((item) =>
        item.id === updatedIngredient.id ? updatedIngredient : item,
      ),
    )
  } catch (error) {
    setIngredientActionError(error.message || 'Could not deactivate ingredient.')
  } finally {
    setDeactivatingIngredientId(null)
  }

  if (updatedIngredient) {
    setIngredientToDeactivate(null)
  }
}

// Reactivates an ingredient through the API while keeping its existing stock and history.
async function reactivateIngredient(ingredient) {
  setIngredientActionError('')

  const token = sessionStorage.getItem('access_token')
  if (!token) {
    setIngredientActionError('Your session has expired. Sign in again.')
    return
  }

  setReactivatingIngredientId(ingredient.id)

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/ingredients/${ingredient.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const detail = errorData?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(' ')
        : detail

      throw new Error(message || `Could not reactivate ingredient (HTTP ${response.status}).`)
    }

    const updatedIngredient = await response.json()
    setIngredients((currentIngredients) =>
      currentIngredients.map((item) =>
        item.id === updatedIngredient.id ? updatedIngredient : item,
      ),
    )
  } catch (error) {
    setIngredientActionError(error.message || 'Could not reactivate ingredient.')
  } finally {
    setReactivatingIngredientId(null)
  }
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
          <button
            className="catalog-button button-quiet"
            type="button"
            onClick={() => setIngredientCreateOpen(true)}
          >
            <Plus size={16} aria-hidden="true" /> Add ingredient
          </button>
          <button className="catalog-button button-quiet" type="button" onClick={() => {
            setMovementSaveError('')
            setMovementSaveSuccess('')
            setActiveAction('adjustment')
          }}>
            <SlidersHorizontal size={15} aria-hidden="true" /> Adjust stock
          </button>
          <button className="catalog-button button-quiet" type="button" onClick={() => {
            setMovementSaveError('')
            setMovementSaveSuccess('')
            setActiveAction('waste')
          }}>
            <Trash2 size={15} aria-hidden="true" /> Record waste
          </button>
          <button
            className="catalog-button button-primary"
            type="button"
            onClick={() => {
              setReceiptSaveError('')
              setReceiptSaveSuccess('')
              setActiveAction('receiving')
            }}
          >
            <Plus size={16} aria-hidden="true" /> Receive stock
          </button>
        </div>
      </div>

      <div className="demo-data-banner" role="note">
        <span className="demo-banner-dot" /> Ingredients, receiving, stock adjustments, waste, and movement history use the API.
      </div>

      {receiptSaveSuccess && (
        <p className="inventory-success-message" role="status">
          <strong>Stock receipt saved.</strong>
          <span>
            Generated receipt number:{' '}
            <code>{receiptSaveSuccess.receiptNumber || 'Not returned by the API'}</code>
          </span>
          {receiptSaveSuccess.refreshNote && <span>{receiptSaveSuccess.refreshNote}</span>}
        </p>
      )}

      {movementSaveSuccess && (
        <p className="inventory-success-message" role="status">
          {movementSaveSuccess}
        </p>
      )}

      <div className="unit-guide-panel" role="note">
        <Scale size={17} aria-hidden="true" />
        <span><strong>Base unit guide</strong>{demoUnitGuides.map((guide) => <small key={guide}>{guide}</small>)}</span>
        <span className="unit-guide-note">kg/g and L/ml convert automatically. Pieces stay whole and 1-to-1.</span>
      </div>

      <section className="catalog-panel inventory-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Ingredients and supplies</h2>
            <p>On-hand amount and reorder threshold in each item's base unit.</p>
          </div>
          <span className="inventory-demo-label">
            <ClipboardList size={15} aria-hidden="true" /> API INGREDIENTS
          </span>
        </div>
        {ingredientActionError && !ingredientToDeactivate && (
          <p className="field-error" role="alert">
            {ingredientActionError}
          </p>
        )}
        <div className="catalog-table-scroll">
          <table className="catalog-table inventory-table">
            <thead>
              <tr>
                <th scope="col">Ingredient</th>
                <th scope="col">ID</th>
                <th scope="col">Type</th>
                <th scope="col">On hand</th>
                <th scope="col">Reorder level</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredientsLoading ? (
                <tr><td colSpan="8">Loading ingredients...</td></tr>
              ) : ingredientsError ? (
                <tr><td colSpan="8" role="alert">{ingredientsError}</td></tr>
              ) : ingredients.length === 0 ? (
                <tr><td colSpan="8">No ingredients found.</td></tr>
              ) : (
                ingredients.map((item) => {
                  const quantity = Number(item.current_quantity)
                  const threshold = Number(item.low_stock_threshold)
                  const status = !item.is_active
                    ? 'Inactive'
                    : quantity <= 0
                      ? 'Out of stock'
                      : quantity <= threshold
                        ? 'Low stock'
                        : 'In stock'
                  const statusClass = status === 'In stock'
                    ? 'inventory-ok'
                    : status === 'Low stock'
                      ? 'inventory-low'
                      : 'inventory-empty'

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="catalog-product-cell">
                          <span className="catalog-product-icon">
                            <Package size={16} aria-hidden="true" />
                          </span>
                          <strong>{item.name}</strong>
                        </span>
                      </td>
                      <td className="catalog-muted-cell">{item.id}</td>
                      <td><span className="inventory-kind-chip">Ingredient</span></td>
                      <td className="inventory-quantity">
                        {formatQuantity(item.current_quantity, item.base_unit)} <span>{item.base_unit}</span>
                      </td>
                      <td className="inventory-reorder-level">
                        {formatQuantity(item.low_stock_threshold, item.base_unit)}
                      </td>
                      <td>
                        <span className={`inventory-status ${statusClass}`}>
                          <span />{status}
                        </span>
                      </td>
                      <td className="catalog-muted-cell">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                      <td className="inventory-row-actions">
                        <button
                          className="table-action-button"
                          type="button"
                          disabled={deactivatingIngredientId !== null || reactivatingIngredientId !== null}
                          onClick={() => setIngredientToEdit(item)}
                        >
                          Edit
                        </button>
                        {item.is_active ? (
                          <button
                            className="table-action-button"
                            type="button"
                            disabled={deactivatingIngredientId !== null || reactivatingIngredientId !== null}
                            onClick={() => {
                              setIngredientActionError('')
                              setIngredientToDeactivate(item)
                            }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="table-action-button"
                            type="button"
                            disabled={deactivatingIngredientId !== null || reactivatingIngredientId !== null}
                            onClick={() => reactivateIngredient(item)}
                          >
                            {reactivatingIngredientId === item.id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">
          Stock levels and statuses use the API's current quantity and low-stock threshold.
        </p>
      </section>

      <section className="catalog-panel inventory-history-panel">
        <div className="catalog-panel-header">
          <div>
            <h2>Stock movement history</h2>
            <p>Auditable receiving, adjustment, and waste entries from the API</p>
          </div>
          <span className="history-count-label">
            {stockMovements.length} entries
          </span>
        </div>
        <div className="catalog-table-scroll">
          <table className="catalog-table history-table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Ingredient or supply</th>
                <th scope="col">Movement</th>
                <th scope="col">Quantity</th>
                <th scope="col">Reason</th>
                <th scope="col">Supplier</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {movementsLoading ? (
                <tr><td colSpan="7">Loading stock movements...</td></tr>
              ) : movementsError ? (
                <tr><td colSpan="7" role="alert">{movementsError}</td></tr>
              ) : stockMovements.length === 0 ? (
                <tr><td colSpan="7">No stock movements recorded yet.</td></tr>
              ) : stockMovements.map((entry) => {
                const quantity = Number(entry.quantity_change)
                const movementType = entry.movement_type === 'receipt'
                  ? 'Receiving'
                  : ['sale', 'sale_use'].includes(entry.movement_type)
                    ? 'Sale use'
                    : entry.movement_type === 'waste'
                      ? 'Waste'
                      : 'Adjustment'
                const reference = entry.receipt_number || `MOV-${String(entry.id).padStart(6, '0')}`

                return (
                <tr key={entry.id}>
                  <td className="catalog-muted-cell">{reference}</td>
                  <td>
                    <span className="history-product-name">
                      {entry.ingredient_name}<small>ING-{String(entry.ingredient_id).padStart(3, '0')}</small>
                    </span>
                  </td>
                  <td>
                    <span className={`history-type ${movementType === 'Receiving' ? 'history-in' : movementType === 'Sale use' ? 'history-sale-use' : 'history-adjustment'}`}>
                      {quantity > 0
                        ? <ArrowUpRight size={13} aria-hidden="true" />
                        : <ArrowDownRight size={13} aria-hidden="true" />}
                      {movementType}
                    </span>
                  </td>
                  <td className={`history-quantity ${quantity > 0 ? 'quantity-positive' : 'quantity-negative'}`}>
                    {quantity > 0 ? '+' : ''}{formatQuantity(quantity, entry.base_unit)} <span>{entry.base_unit}</span>
                  </td>
                  <td>{entry.reason || '—'}</td>
                  <td>{entry.supplier_name || '—'}</td>
                  <td className="catalog-muted-cell">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="catalog-table-footnote">
          Sale consumption will appear after checkout is connected to inventory.
        </p>
      </section>

      {ingredientCreateOpen && (
        <IngredientCreateDialog
          onClose={() => setIngredientCreateOpen(false)}
          onCreated={(newIngredient) => {
            setIngredients((currentIngredients) =>
              [...currentIngredients, newIngredient].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            )
            setIngredientCreateOpen(false)
          }}
        />
      )}

      {ingredientToEdit && (
        <IngredientEditDialog
          ingredient={ingredientToEdit}
          onClose={() => setIngredientToEdit(null)}
          onUpdated={(updatedIngredient) => {
            setIngredients((currentIngredients) =>
              currentIngredients
                .map((item) =>
                  item.id === updatedIngredient.id ? updatedIngredient : item,
                )
                .sort((a, b) => a.name.localeCompare(b.name)),
            )
            setIngredientToEdit(null)
          }}
        />
      )}

      {activeAction && (
        <InventoryActionDialog
          key={activeAction}
          actionType={activeAction}
          onClose={closeInventoryDialog}
          onSubmit={selectedHandler}
          ingredients={ingredients}
          ingredientsLoading={ingredientsLoading}
          ingredientsError={ingredientsError}
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          suppliersError={suppliersError}
          receiptSaveError={receiptSaveError}
        />
      )}

      {ingredientToDeactivate && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              deactivatingIngredientId === null
            ) {
              setIngredientToDeactivate(null)
            }
          }}
        >
          <section
            className="catalog-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-ingredient-title"
          >
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">INGREDIENT INVENTORY</span>
                <h2 id="deactivate-ingredient-title">Deactivate ingredient?</h2>
              </div>
            </div>

            <p className="dialog-preview-note">
              <strong>{ingredientToDeactivate.name}</strong> will no longer be available
              for new recipes or stock receipts. Existing stock and history will be kept.
            </p>

            {ingredientActionError && (
              <p className="field-error" role="alert">
                {ingredientActionError}
              </p>
            )}

            <div className="dialog-actions">
              <button
                className="catalog-button button-quiet"
                type="button"
                disabled={deactivatingIngredientId !== null}
                onClick={() => setIngredientToDeactivate(null)}
              >
                Cancel
              </button>
              <button
                className="catalog-button button-primary"
                type="button"
                disabled={deactivatingIngredientId !== null}
                onClick={() => deactivateIngredient(ingredientToDeactivate)}
              >
                {deactivatingIngredientId !== null ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

export default InventoryPage
