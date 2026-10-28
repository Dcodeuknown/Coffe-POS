// Static admin examples for Batch 9 screens. Values are illustrative UI content, not calculated.
// TODO (MANUAL): Load these records from your own recipe, supplier, user, and reports APIs.
export const demoRecipes = [
  { id: 'recipe-101', menuItem: 'Vanilla latte', variant: 'Medium · Hot', yield: '1 drink', estimatedCost: '$1.18', status: 'Draft' },
  { id: 'recipe-102', menuItem: 'Vanilla latte', variant: 'Large · Iced', yield: '1 drink', estimatedCost: '$1.46', status: 'Draft' },
  { id: 'recipe-103', menuItem: 'Matcha latte', variant: 'Medium · Hot', yield: '1 drink', estimatedCost: '$1.32', status: 'Draft' },
  { id: 'recipe-104', menuItem: 'Butter croissant', variant: 'Single', yield: '1 piece', estimatedCost: '$1.05', status: 'Draft' },
]

export const demoRecipeIngredients = [
  { name: 'Espresso beans', unit: 'g' },
  { name: 'Whole milk', unit: 'ml' },
  { name: 'Oat milk', unit: 'ml' },
  { name: 'Vanilla syrup', unit: 'ml' },
  { name: 'Matcha powder', unit: 'g' },
  { name: '12 oz cold cups', unit: 'pcs' },
  { name: 'Cold cup lids', unit: 'pcs' },
]

export const demoReceivingHistory = [
  { id: 'RCV-0208', supplier: 'North Roast Supply', items: 'Espresso beans', quantity: '4,000 g', received: 'Oct 28, 2026 · 9:15 AM', reference: 'PO preview · 208' },
  { id: 'RCV-0202', supplier: 'Fresh Dairy Co.', items: 'Whole milk, oat milk', quantity: '6,000 ml', received: 'Oct 27, 2026 · 8:42 AM', reference: 'Invoice preview · 774' },
  { id: 'RCV-0196', supplier: 'Cafe Essentials', items: '12 oz cold cups, lids', quantity: '200 pcs', received: 'Oct 25, 2026 · 11:20 AM', reference: 'Delivery note · 451' },
]

export const demoUsers = [
  { id: 'USR-001', name: 'Mia Chen', email: 'mia@example.test', role: 'Cashier', status: 'Active', lastActive: 'Today, 10:42 AM' },
  { id: 'USR-002', name: 'Jordan Lee', email: 'jordan@example.test', role: 'Cashier', status: 'Active', lastActive: 'Today, 10:18 AM' },
  { id: 'USR-003', name: 'Sam Rivera', email: 'sam@example.test', role: 'Manager', status: 'Active', lastActive: 'Today, 9:31 AM' },
  { id: 'USR-004', name: 'Alex Morgan', email: 'alex@example.test', role: 'Admin', status: 'Active', lastActive: 'Yesterday, 4:10 PM' },
]

export const demoReportMetrics = [
  { label: 'Sales today', value: '$1,284.50', detail: 'Demo total · Oct 28' },
  { label: 'Orders today', value: '38', detail: 'Demo transaction count' },
  { label: 'Waste this week', value: '$24.80', detail: 'Illustrative recorded value' },
  { label: 'Estimated recipe cost', value: '28.4%', detail: 'Illustrative menu average' },
]

export const demoReportBestSellers = [
  { name: 'Vanilla latte', units: '82 drinks', share: '88%' },
  { name: 'Iced vanilla latte', units: '64 drinks', share: '71%' },
  { name: 'Butter croissant', units: '43 pieces', share: '49%' },
  { name: 'Matcha latte', units: '29 drinks', share: '36%' },
]

export const demoReportStockSignals = [
  { name: 'Vanilla syrup', quantity: '1,500 ml', status: 'Low stock' },
  { name: '12 oz cold cups', quantity: '42 pcs', status: 'Low stock' },
  { name: 'Cold cup lids', quantity: '0 pcs', status: 'Out of stock' },
]

export const demoReportMovements = [
  { label: 'Receiving', value: '12 entries', width: '82%' },
  { label: 'Sale use', value: '86 entries', width: '96%' },
  { label: 'Waste', value: '4 entries', width: '32%' },
  { label: 'Adjustments', value: '3 entries', width: '24%' },
]
