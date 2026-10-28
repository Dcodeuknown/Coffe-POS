// UI-only menu content for previewing a single-location coffee shop POS.
// TODO (MANUAL): Replace these examples with menu and category API responses later.
export const demoMenuCategories = [
  { id: 'cat-coffee', name: 'Coffee', description: 'Espresso and brewed coffee', menuItemCount: 2, status: 'Active' },
  { id: 'cat-iced', name: 'Iced Coffee', description: 'Chilled coffee and espresso drinks', menuItemCount: 2, status: 'Active' },
  { id: 'cat-tea', name: 'Tea', description: 'Hot and iced tea selections', menuItemCount: 1, status: 'Active' },
  { id: 'cat-non-coffee', name: 'Non-Coffee', description: 'Milk, cocoa, and matcha drinks', menuItemCount: 1, status: 'Active' },
  { id: 'cat-food', name: 'Food', description: 'Pastries and light bites', menuItemCount: 1, status: 'Active' },
]

export const demoMenuItems = [
  {
    id: 'menu-101', name: 'Vanilla latte', description: 'Espresso with steamed milk and vanilla.', sku: 'COF-101', category: 'Coffee',
    price: '$4.25', status: 'Available', variantSummary: 'Small · Medium · Large · Hot / iced',
    variantDetails: 'Small hot — $3.75\nMedium hot — $4.25\nLarge hot — $4.75\nMedium iced — $4.75\nLarge iced — $5.25',
    modifierSummary: 'Milk · Sweetness · Syrup · Extra shot', recipeStatus: 'Recipe setup is a later step',
    variants: [{ name: 'Small · Hot', price: '$3.75' }, { name: 'Medium · Hot', price: '$4.25' }, { name: 'Large · Hot', price: '$4.75' }, { name: 'Medium · Iced', price: '$4.75' }, { name: 'Large · Iced', price: '$5.25' }],
    modifierGroups: [
      { name: 'Milk choice', options: ['Whole', 'Oat', 'Almond'] },
      { name: 'Sweetness', options: ['Regular', 'Less sweet', 'Unsweetened'] },
      { name: 'Syrup', options: ['Vanilla', 'Caramel', 'Hazelnut'] },
      { name: 'Extra espresso', options: ['Add a shot'] },
    ],
    availabilityPreview: 'Available demo',
  },
  {
    id: 'menu-102', name: 'Iced vanilla latte', description: 'Chilled espresso, milk, and vanilla syrup.', sku: 'ICE-102', category: 'Iced Coffee',
    price: '$4.75', status: 'Available', variantSummary: 'Medium · Large',
    variantDetails: 'Medium — $4.75\nLarge — $5.25',
    modifierSummary: 'Milk · Sweetness · Syrup · Extra shot', recipeStatus: 'Recipe setup is a later step',
    variants: [{ name: 'Medium', price: '$4.75' }, { name: 'Large', price: '$5.25' }],
    modifierGroups: [
      { name: 'Milk choice', options: ['Whole', 'Oat', 'Almond'] },
      { name: 'Sweetness', options: ['Regular', 'Less sweet', 'Unsweetened'] },
      { name: 'Syrup', options: ['Vanilla', 'Caramel', 'Hazelnut'] },
      { name: 'Extra espresso', options: ['Add a shot'] },
    ],
    availabilityPreview: 'Shortage preview',
  },
  {
    id: 'menu-103', name: 'Cold brew', description: 'Slow-steeped coffee served chilled.', sku: 'ICE-103', category: 'Iced Coffee',
    price: '$4.00', status: 'Available', variantSummary: 'Medium · Large',
    variantDetails: 'Medium — $4.00\nLarge — $4.75',
    modifierSummary: 'Milk · Sweetness · Syrup', recipeStatus: 'Recipe setup is a later step',
    variants: [{ name: 'Medium', price: '$4.00' }, { name: 'Large', price: '$4.75' }],
    modifierGroups: [
      { name: 'Milk choice', options: ['Whole', 'Oat', 'Almond'] },
      { name: 'Sweetness', options: ['Regular', 'Less sweet', 'Unsweetened'] },
      { name: 'Syrup', options: ['Vanilla', 'Caramel', 'Hazelnut'] },
    ],
    availabilityPreview: 'Available demo',
  },
  {
    id: 'menu-104', name: 'Matcha latte', description: 'Matcha whisked with steamed milk.', sku: 'NCF-104', category: 'Non-Coffee',
    price: '$4.50', status: 'Available', variantSummary: 'Small · Medium · Large',
    variantDetails: 'Small — $4.00\nMedium — $4.50\nLarge — $5.00',
    modifierSummary: 'Milk · Sweetness', recipeStatus: 'Recipe setup is a later step',
    variants: [{ name: 'Small', price: '$4.00' }, { name: 'Medium', price: '$4.50' }, { name: 'Large', price: '$5.00' }],
    modifierGroups: [
      { name: 'Milk choice', options: ['Whole', 'Oat', 'Almond'] },
      { name: 'Sweetness', options: ['Regular', 'Less sweet', 'Unsweetened'] },
    ],
    availabilityPreview: 'Available demo',
  },
  {
    id: 'menu-107', name: 'Earl Grey tea', description: 'Black tea steeped to order.', sku: 'TEA-107', category: 'Tea',
    price: '$3.25', status: 'Available', variantSummary: 'Small · Medium · Large',
    variantDetails: 'Small — $2.75\nMedium — $3.25\nLarge — $3.75', modifierSummary: 'Sweetness · Lemon',
    recipeStatus: 'Recipe setup is a later step',
    variants: [{ name: 'Small', price: '$2.75' }, { name: 'Medium', price: '$3.25' }, { name: 'Large', price: '$3.75' }],
    modifierGroups: [{ name: 'Sweetness', options: ['Regular', 'Less sweet', 'Unsweetened'] }, { name: 'Add-on', options: ['Lemon'] }],
    availabilityPreview: 'Available demo',
  },
  {
    id: 'menu-105', name: 'Butter croissant', description: 'Flaky butter pastry, served warm.', sku: 'FOD-105', category: 'Food',
    price: '$3.75', status: 'Available', variantSummary: 'Single',
    variantDetails: 'Single — $3.75', modifierSummary: 'No modifiers shown',
    recipeStatus: 'Recipe setup is a later step', variants: [{ name: 'Single', price: '$3.75' }], modifierGroups: [],
    availabilityPreview: 'Available demo',
  },
  {
    id: 'menu-106', name: 'Espresso', description: 'A double shot of the house espresso.', sku: 'COF-106', category: 'Coffee',
    price: '$2.75', status: 'Available', variantSummary: 'Single · Double',
    variantDetails: 'Single — $2.25\nDouble — $2.75', modifierSummary: 'Extra espresso',
    recipeStatus: 'Recipe setup is a later step', variants: [{ name: 'Single', price: '$2.25' }, { name: 'Double', price: '$2.75' }],
    modifierGroups: [{ name: 'Extra espresso', options: ['Add a shot'] }],
    availabilityPreview: 'Unavailable demo',
  },
]
