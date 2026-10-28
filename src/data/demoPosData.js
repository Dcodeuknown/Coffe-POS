// UI-only cart preview. Rows and totals are fixed demo values, not calculated.
// TODO (MANUAL): Replace this sample with cart state after you implement the POS behavior yourself.
export const demoCartItems = [
  { id: 'menu-101', name: 'Vanilla latte', variant: 'Medium · Hot', modifiers: 'Oat milk · Less sweet · Vanilla', quantity: '1', price: '$4.25' },
  { id: 'menu-102', name: 'Iced vanilla latte', variant: 'Large · Iced', modifiers: 'Whole milk · Regular sweet', quantity: '1', price: '$5.25' },
  { id: 'menu-105', name: 'Butter croissant', variant: 'Single', modifiers: 'No modifiers', quantity: '1', price: '$3.75' },
]

export const demoPosTotals = {
  subtotal: '$13.25',
  total: '$13.25',
}

export const demoCartOrderType = 'Takeaway'

// Static checkout response examples for the UI. They do not reflect a stock or payment check.
export const demoCheckoutFeedback = [
  {
    id: 'ingredient-shortage',
    tone: 'warning',
    title: 'Ingredient shortage example',
    message: 'A required ingredient may be below the shop threshold. A later backend check should identify the ingredient and explain what needs attention.',
  },
  {
    id: 'payment-error',
    tone: 'error',
    title: 'Payment recording error example',
    message: 'The payment method could not be recorded. The later checkout flow should keep the sale unconfirmed and show the backend error.',
  },
]

export const demoReceiptNumber = 'DEMO-0001'
