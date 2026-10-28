// UI-only demo content for the admin dashboard. These values are not real store data.
// TODO (MANUAL): Replace this file's values with data from the dashboard/report API later.
export const demoMetrics = [
  { label: 'Sales today', value: '$1,284.50', detail: 'Demo sales total', icon: 'sales' },
  { label: 'Orders today', value: '38', detail: 'Demo order count', icon: 'orders' },
  { label: 'Available menu items', value: '7', detail: 'Demo menu count', icon: 'products' },
  { label: 'Low-stock ingredients', value: '3', detail: 'Demo ingredient count', icon: 'stock' },
]

export const demoRecentSales = [
  { id: 'SALE-1048', items: '2 × Vanilla latte', orderType: 'Takeaway', time: '10:42 AM', payment: 'Cash', total: '$8.50' },
  { id: 'SALE-1047', items: 'Iced vanilla latte · Croissant', orderType: 'Dine-in', time: '10:18 AM', payment: 'Recorded card', total: '$8.50' },
  { id: 'SALE-1046', items: 'Cold brew · Matcha latte', orderType: 'Takeaway', time: '09:56 AM', payment: 'Cash', total: '$8.50' },
  { id: 'SALE-1045', items: 'Espresso · Butter croissant', orderType: 'Dine-in', time: '09:31 AM', payment: 'Recorded card', total: '$6.50' },
]

export const demoLowStock = [
  { name: 'Vanilla syrup', sku: 'ING-103', quantity: '1,500 ml', status: 'Low' },
  { name: '12 oz cold cups', sku: 'SUP-201', quantity: '42 pcs', status: 'Low' },
  { name: 'Cold cup lids', sku: 'SUP-202', quantity: '0 pcs', status: 'Out' },
]
