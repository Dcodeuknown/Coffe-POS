// UI-only inventory preview for ingredients and counted supplies. Values and statuses are fictional.
// TODO (MANUAL): Replace these rows with inventory and stock-movement API responses later.
// Base units shown here are g (mass), ml (volume), and pcs (count). Live inventory converts kg/g and L/ml; piece counts remain 1-to-1.
export const demoIngredients = [
  { id: 'ing-101', name: 'Espresso beans', code: 'ING-101', kind: 'Ingredient', quantity: '8,400', unit: 'g', reorderLevel: '2,000 g', status: 'In stock', updated: 'Today, 9:15 AM' },
  { id: 'ing-102', name: 'Whole milk', code: 'ING-102', kind: 'Ingredient', quantity: '12,500', unit: 'ml', reorderLevel: '3,000 ml', status: 'In stock', updated: 'Today, 8:42 AM' },
  { id: 'ing-103', name: 'Vanilla syrup', code: 'ING-103', kind: 'Ingredient', quantity: '1,500', unit: 'ml', reorderLevel: '2,000 ml', status: 'Low stock', updated: 'Today, 8:12 AM' },
  { id: 'ing-104', name: 'Oat milk', code: 'ING-104', kind: 'Ingredient', quantity: '2,400', unit: 'ml', reorderLevel: '1,000 ml', status: 'In stock', updated: 'Today, 7:50 AM' },
  { id: 'sup-201', name: '12 oz cold cups', code: 'SUP-201', kind: 'Supply', quantity: '42', unit: 'pcs', reorderLevel: '50 pcs', status: 'Low stock', updated: 'Yesterday, 4:26 PM' },
  { id: 'sup-202', name: 'Cold cup lids', code: 'SUP-202', kind: 'Supply', quantity: '0', unit: 'pcs', reorderLevel: '40 pcs', status: 'Out of stock', updated: 'Yesterday, 3:54 PM' },
]

export const demoSuppliers = [
  { id: 'suppl-01', name: 'North Roast Supply' },
  { id: 'suppl-02', name: 'Fresh Dairy Co.' },
  { id: 'suppl-03', name: 'Cafe Essentials' },
]

export const demoStockMovements = [
  { id: 'MOV-0208', ingredient: 'Espresso beans', code: 'ING-101', type: 'Receiving', quantity: '+4,000', unit: 'g', reason: 'Weekly delivery', supplier: 'North Roast Supply', date: 'Today, 9:15 AM' },
  { id: 'MOV-0207', ingredient: 'Vanilla syrup', code: 'ING-103', type: 'Waste', quantity: '-250', unit: 'ml', reason: 'Spill', supplier: '—', date: 'Today, 8:12 AM' },
  { id: 'MOV-0206', ingredient: '12 oz cold cups', code: 'SUP-201', type: 'Adjustment', quantity: '-8', unit: 'pcs', reason: 'Count correction', supplier: '—', date: 'Yesterday, 4:26 PM' },
  { id: 'MOV-0205', ingredient: 'Whole milk', code: 'ING-102', type: 'Sale use', quantity: '-360', unit: 'ml', reason: 'Demo sale reference', supplier: '—', date: 'Yesterday, 2:18 PM' },
]

// Display-only reference values for the UI preview; live inventory conversions are handled by the API.
export const demoUnitGuides = ['1 kg = 1,000 g', '1 L = 1,000 ml']
