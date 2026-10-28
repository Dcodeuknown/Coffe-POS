// Static sales-history examples for interface previews only; these are not real transactions.
// TODO (MANUAL): Replace this data with sales and sale-item records from your API.
export const demoSales = [
  {
    id: 'SALE-1048', date: '2026-10-28', time: '10:42 AM', cashier: 'Mia Chen', status: 'Completed', orderType: 'Takeaway', payment: 'Cash', total: '$8.50',
    items: [
      { id: '1048-1', name: 'Vanilla latte', variant: 'Medium · Hot', modifiers: 'Oat milk · Less sweet · Vanilla', quantity: '1', price: '$4.25' },
      { id: '1048-2', name: 'Vanilla latte', variant: 'Large · Hot', modifiers: 'Whole milk · Regular sweet', quantity: '1', price: '$4.25' },
    ],
  },
  {
    id: 'SALE-1047', date: '2026-10-28', time: '10:18 AM', cashier: 'Jordan Lee', status: 'Completed', orderType: 'Dine-in', payment: 'Recorded card', total: '$8.50',
    items: [
      { id: '1047-1', name: 'Iced vanilla latte', variant: 'Large · Iced', modifiers: 'Oat milk · Vanilla', quantity: '1', price: '$5.25' },
      { id: '1047-2', name: 'Butter croissant', variant: 'Single', modifiers: 'No modifiers', quantity: '1', price: '$3.25' },
    ],
  },
  {
    id: 'SALE-1046', date: '2026-10-28', time: '09:56 AM', cashier: 'Mia Chen', status: 'Voided', orderType: 'Takeaway', payment: 'Cash', total: '$8.50',
    items: [
      { id: '1046-1', name: 'Cold brew', variant: 'Medium · Iced', modifiers: 'No modifiers', quantity: '1', price: '$4.25' },
      { id: '1046-2', name: 'Matcha latte', variant: 'Medium · Hot', modifiers: 'Whole milk · Regular sweet', quantity: '1', price: '$4.25' },
    ],
  },
  {
    id: 'SALE-1045', date: '2026-10-27', time: '09:31 AM', cashier: 'Sam Rivera', status: 'Refund requested', orderType: 'Dine-in', payment: 'Recorded card', total: '$6.50',
    items: [
      { id: '1045-1', name: 'Espresso', variant: 'Single · Hot', modifiers: 'No modifiers', quantity: '1', price: '$3.25' },
      { id: '1045-2', name: 'Butter croissant', variant: 'Single', modifiers: 'No modifiers', quantity: '1', price: '$3.25' },
    ],
  },
  {
    id: 'SALE-1044', date: '2026-10-27', time: '09:14 AM', cashier: 'Jordan Lee', status: 'Completed', orderType: 'Takeaway', payment: 'E-wallet', total: '$5.25',
    items: [{ id: '1044-1', name: 'Iced vanilla latte', variant: 'Medium · Iced', modifiers: 'Oat milk · Less sweet', quantity: '1', price: '$5.25' }],
  },
]

export const demoCashiers = ['Mia Chen', 'Jordan Lee', 'Sam Rivera']
