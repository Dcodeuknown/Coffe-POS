import { useState } from 'react'
import { ArrowUpRight, BarChart3, BookOpen, ClipboardList, Plus, Users, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout.jsx'
import { demoMenuItems } from '../../data/demoCatalogData.js'
import { demoSuppliers } from '../../data/demoInventoryData.js'
import {
  demoRecipes,
  demoRecipeIngredients,
  demoReceivingHistory,
  demoUsers,
  demoReportMetrics,
  demoReportBestSellers,
  demoReportStockSignals,
  demoReportMovements,
} from '../../data/demoAdminOpsData.js'

function AdminPageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="catalog-page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  )
}

function DemoBanner({ children }) {
  return <div className="demo-data-banner admin-ops-banner" role="note"><span className="demo-banner-dot" />{children}</div>
}

function RecipeEditorDialog({ recipe, onClose, onSubmit }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="catalog-dialog recipe-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-editor-title">
        <div className="dialog-heading"><div><span className="eyebrow">RECIPE EDITOR PREVIEW</span><h2 id="recipe-editor-title">{recipe ? 'Edit recipe' : 'New recipe'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close recipe editor"><X size={18} /></button></div>
        <p className="dialog-preview-note">This form demonstrates recipe structure. It does not calculate costs or affect ingredient stock.</p>
        <form className="catalog-form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
          <div className="catalog-form-grid">
            <div className="catalog-field"><label htmlFor="recipe-menu-item">Menu item</label><select id="recipe-menu-item" defaultValue={recipe?.menuItem || ''}><option value="">Choose menu item</option>{demoMenuItems.map((item) => <option key={item.id}>{item.name}</option>)}</select></div>
            <div className="catalog-field"><label htmlFor="recipe-variant">Variant</label><input id="recipe-variant" defaultValue={recipe?.variant || ''} placeholder="e.g. Medium · Hot" /></div>
            <div className="catalog-field"><label htmlFor="recipe-yield">Recipe yield</label><input id="recipe-yield" defaultValue={recipe?.yield || '1 drink'} placeholder="e.g. 1 drink" /></div>
            <div className="catalog-field"><label htmlFor="recipe-status">Status</label><select id="recipe-status" defaultValue={recipe?.status || 'Draft'}><option>Draft</option><option>Active</option><option>Archived</option></select></div>
          </div>
          <div className="recipe-editor-section"><div className="recipe-editor-subhead"><div><strong>Base ingredients</strong><small>Enter quantities in each ingredient's base unit.</small></div><button className="recipe-add-row" type="button"><Plus size={14} /> Add ingredient row</button></div>
            <div className="recipe-line-table"><div className="recipe-line-header"><span>Ingredient</span><span>Quantity</span><span>Unit</span></div>
              {[0, 1, 2].map((row) => <div className="recipe-line-row" key={row}><select aria-label={`Ingredient row ${row + 1}`} defaultValue={row === 0 ? demoRecipeIngredients[0].name : ''}><option value="">Choose ingredient</option>{demoRecipeIngredients.map((ingredient) => <option key={ingredient.name}>{ingredient.name}</option>)}</select><input aria-label={`Quantity row ${row + 1}`} placeholder="0" inputMode="decimal" /><select aria-label={`Unit row ${row + 1}`} defaultValue={row === 0 ? demoRecipeIngredients[0].unit : ''}><option value="">Unit</option><option>g</option><option>ml</option><option>pcs</option></select></div>)}
            </div>
          </div>
          <div className="recipe-editor-section"><div className="recipe-editor-subhead"><div><strong>Modifier recipe rules</strong><small>Choose whether a modifier adds or substitutes ingredients.</small></div></div>
            <div className="recipe-modifier-preview"><label>Modifier example<input placeholder="e.g. Oat milk" /></label><label>Rule<select defaultValue="Substitution"><option>Add ingredient</option><option>Substitution</option></select></label><label>Ingredient affected<select defaultValue="Whole milk"><option>Whole milk</option><option>Oat milk</option><option>Espresso beans</option></select></label></div>
            <p className="recipe-rule-note">This only shows where you define a rule. No recipe quantities or substitutions are applied.</p>
          </div>
          <div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button><button className="catalog-button button-primary" type="submit">Save recipe preview</button></div>
        </form>
      </section>
    </div>
  )
}

export function RecipesPage() {
  const [editorRecipe, setEditorRecipe] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)

  function handleSaveRecipe() {
    // TODO (MANUAL): Validate recipe lines and save a recipe version through your API.
    // Keep past sales linked to the recipe snapshot used at checkout.
  }

  return <AdminLayout>
    <AdminPageHeading eyebrow="MENU PREPARATION" title="Recipes" description="Link menu variants to ingredient quantities and modifier rules." action={<button className="catalog-button button-primary" type="button" onClick={() => { setEditorRecipe(null); setEditorOpen(true) }}><Plus size={16} /> New recipe</button>} />
    <DemoBanner>Recipe quantities and estimated costs are fictional examples. No cost or ingredient calculations are performed.</DemoBanner>
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Recipe list</h2><p>{demoRecipes.length} demo recipes · menu variants have separate recipes</p></div><span className="admin-panel-icon"><BookOpen size={17} /></span></div>
      <div className="catalog-table-scroll"><table className="catalog-table recipe-table"><thead><tr><th>Menu item</th><th>Variant</th><th>Yield</th><th>Estimated cost</th><th>Status</th><th>Recipe inputs</th><th /></tr></thead><tbody>{demoRecipes.map((recipe) => <tr key={recipe.id}><td><strong>{recipe.menuItem}</strong></td><td>{recipe.variant}</td><td>{recipe.yield}</td><td>{recipe.estimatedCost}<small className="table-subnote">Illustrative</small></td><td><span className="ops-status ops-status-draft">{recipe.status}</span></td><td>Ingredients · modifiers</td><td><button className="table-action-button" type="button" onClick={() => { setEditorRecipe(recipe); setEditorOpen(true) }}>Edit preview</button></td></tr>)}</tbody></table></div>
      <p className="catalog-table-footnote">Recipe changes should apply to future orders only; preserve the recipe details used by historical sales.</p>
    </section>
    <section className="recipe-policy-card"><div className="admin-panel-icon"><BookOpen size={18} /></div><div><strong>Variant and modifier rules</strong><p>Sizes can use different recipes. Extra shots add ingredient requirements, and substitution options replace the relevant base ingredient.</p></div></section>
    {editorOpen && <RecipeEditorDialog recipe={editorRecipe} onClose={() => setEditorOpen(false)} onSubmit={handleSaveRecipe} />}
  </AdminLayout>
}

function SupplierFormDialog({ onClose, onSubmit }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="catalog-dialog supplier-form-dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title"><div className="dialog-heading"><div><span className="eyebrow">SUPPLIER FORM PREVIEW</span><h2 id="supplier-form-title">Add supplier</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close supplier form"><X size={18} /></button></div><p className="dialog-preview-note">Supplier details entered here are not saved to the demo list.</p><div className="catalog-form-grid"><div className="catalog-field field-span-two"><label htmlFor="supplier-name">Supplier name</label><input id="supplier-name" placeholder="Company or supplier name" /></div><div className="catalog-field"><label htmlFor="supplier-contact">Contact person</label><input id="supplier-contact" placeholder="Contact name" /></div><div className="catalog-field"><label htmlFor="supplier-phone">Phone</label><input id="supplier-phone" type="tel" placeholder="Phone number" /></div><div className="catalog-field field-span-two"><label htmlFor="supplier-email">Email</label><input id="supplier-email" type="email" placeholder="orders@example.com" /></div><div className="catalog-field field-span-two"><label htmlFor="supplier-items">Products supplied</label><textarea id="supplier-items" rows="2" placeholder="e.g. coffee beans, milk, cups" /></div></div><p className="role-permission-note">TODO: Connect this form to supplier storage and validation when you implement the backend.</p><div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button><button className="catalog-button button-primary" type="button" onClick={onSubmit}>Save supplier preview</button></div></section></div>
}

export function SuppliersPage() {
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  function handleSaveSupplier() {
    // TODO (MANUAL): Validate and create the supplier through your supplier API.
  }
  return <AdminLayout>
    <AdminPageHeading eyebrow="STOCK SOURCES" title="Suppliers and receiving" description="Review supplier details and the sample history of received stock." action={<div className="supplier-heading-actions"><button className="catalog-button button-primary" type="button" onClick={() => setSupplierFormOpen(true)}><Plus size={16} /> Add supplier</button><a className="catalog-button button-quiet" href="/admin/inventory"><ClipboardList size={16} /> Open receiving form</a></div>} />
    <DemoBanner>Supplier contacts and delivery records are sample data. Receiving forms do not update inventory.</DemoBanner>
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Suppliers</h2><p>{demoSuppliers.length} supplier examples</p></div><span className="admin-panel-icon"><ClipboardList size={17} /></span></div>
      <div className="supplier-card-grid">{demoSuppliers.map((supplier, index) => <article className="supplier-card" key={supplier.id}><div className="supplier-card-top"><span className="admin-panel-icon"><ClipboardList size={16} /></span><span className="ops-status ops-status-active">Sample</span></div><h3>{supplier.name}</h3><p>{['Coffee and roasted beans', 'Milk and refrigerated products', 'Cups and cafe supplies'][index]}</p><div><small>Supplier reference</small><strong>{supplier.id.toUpperCase()}</strong></div><div><small>Contact details</small><strong>{['orders@northroast.example.test', 'hello@freshdairy.example.test', 'sales@cafeessentials.example.test'][index]}</strong></div></article>)}</div>
      <p className="catalog-table-footnote">Supplier records, contact details, and terms are display examples only.</p>
    </section>
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Receiving history</h2><p>Sample deliveries recorded against suppliers</p></div><a className="catalog-switch-link" href="/admin/inventory">Manage ingredient stock <ArrowUpRight size={14} /></a></div>
      <div className="catalog-table-scroll"><table className="catalog-table receiving-table"><thead><tr><th>Receipt</th><th>Supplier</th><th>Items received</th><th>Quantity preview</th><th>Received</th><th>Reference</th></tr></thead><tbody>{demoReceivingHistory.map((receipt) => <tr key={receipt.id}><td><strong>{receipt.id}</strong></td><td>{receipt.supplier}</td><td>{receipt.items}</td><td>{receipt.quantity}</td><td>{receipt.received}</td><td>{receipt.reference}</td></tr>)}</tbody></table></div>
      <p className="catalog-table-footnote">For actual receiving, record each ingredient/supply and its base unit with an auditable stock movement.</p>
    </section>
    {supplierFormOpen && <SupplierFormDialog onClose={() => setSupplierFormOpen(false)} onSubmit={handleSaveSupplier} />}
  </AdminLayout>
}

function UserInviteDialog({ onClose, onSubmit }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="catalog-dialog user-invite-dialog" role="dialog" aria-modal="true" aria-labelledby="user-invite-title"><div className="dialog-heading"><div><span className="eyebrow">USER FORM PREVIEW</span><h2 id="user-invite-title">Add team member</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close user form"><X size={18} /></button></div><p className="dialog-preview-note">This form does not create a user or grant permissions.</p><div className="catalog-form-grid"><div className="catalog-field"><label htmlFor="team-name">Name</label><input id="team-name" placeholder="Team member name" /></div><div className="catalog-field"><label htmlFor="team-email">Email</label><input id="team-email" type="email" placeholder="name@example.com" /></div><div className="catalog-field"><label htmlFor="team-role">Role preview</label><select id="team-role"><option>Cashier</option><option>Manager</option><option>Admin</option></select></div><div className="catalog-field"><label htmlFor="team-status">Status</label><select id="team-status"><option>Invited</option><option>Active</option><option>Inactive</option></select></div></div><p className="role-permission-note">Role controls are only labels here. The backend must enforce access permissions.</p><div className="dialog-actions"><button className="catalog-button button-quiet" type="button" onClick={onClose}>Close</button><button className="catalog-button button-primary" type="button" onClick={onSubmit}>Save user preview</button></div></section></div>
}

export function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  function handleSaveUser() {
    // TODO (MANUAL): Create or invite a user through the authentication API.
    // Implement role checks and password setup in the backend, not in this preview.
  }
  return <AdminLayout>
    <AdminPageHeading eyebrow="TEAM ACCESS" title="Users" description="Review sample staff accounts, roles, and account status." action={<button className="catalog-button button-primary" type="button" onClick={() => setInviteOpen(true)}><Users size={16} /> Add team member</button>} />
    <DemoBanner>These account names and statuses are sample data. Role labels do not enforce access.</DemoBanner>
    <section className="catalog-panel admin-ops-panel">
      <div className="catalog-panel-header"><div><h2>Team members</h2><p>{demoUsers.length} sample accounts</p></div><span className="admin-panel-icon"><Users size={17} /></span></div>
      <div className="catalog-table-scroll"><table className="catalog-table users-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th></tr></thead><tbody>{demoUsers.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small className="table-subnote">{user.id}</small></td><td>{user.email}</td><td><span className={`role-chip role-${user.role.toLowerCase()}`}>{user.role}</span></td><td><span className="ops-status ops-status-active">{user.status}</span></td><td>{user.lastActive}</td></tr>)}</tbody></table></div>
      <p className="catalog-table-footnote">Authentication, invitations, and authorization checks are not connected.</p>
    </section>
    {inviteOpen && <UserInviteDialog onClose={() => setInviteOpen(false)} onSubmit={handleSaveUser} />}
  </AdminLayout>
}

export function ReportsPage() {
  return <AdminLayout>
    <AdminPageHeading eyebrow="STORE PERFORMANCE" title="Reports" description="Sample sales and stock summaries for the coffee shop." action={<span className="report-period-chip">October 2026 · Demo period</span>} />
    <DemoBanner>All metrics and bar lengths are fixed examples. This page does not calculate from sales or inventory.</DemoBanner>
    <section className="report-metric-grid" aria-label="Sample report metrics">{demoReportMetrics.map((metric) => <article className="report-metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>
    <div className="report-content-grid">
      <section className="catalog-panel admin-ops-panel"><div className="catalog-panel-header"><div><h2>Best-selling menu items</h2><p>Sample units sold for the selected period</p></div><span className="admin-panel-icon"><BarChart3 size={17} /></span></div><div className="report-ranking-list">{demoReportBestSellers.map((item, index) => <article className="report-ranking-row" key={item.name}><span className="report-rank">0{index + 1}</span><div className="report-ranking-copy"><strong>{item.name}</strong><small>{item.units}</small><span className="report-bar-track"><i style={{ width: item.share }} /></span></div><span className="report-share-label">{item.share}</span></article>)}</div><p className="catalog-table-footnote">Bar size is an illustrative label, not a computed share.</p></section>
      <section className="catalog-panel admin-ops-panel"><div className="catalog-panel-header"><div><h2>Ingredient alerts</h2><p>Fixed low-stock examples</p></div><span className="admin-panel-icon"><ClipboardList size={17} /></span></div><div className="report-stock-list">{demoReportStockSignals.map((item) => <article className="report-stock-row" key={item.name}><span><strong>{item.name}</strong><small>{item.quantity}</small></span><span className="ops-status ops-status-low">{item.status}</span></article>)}</div><a className="report-panel-link" href="/admin/inventory">View ingredient inventory <ArrowUpRight size={14} /></a></section>
    </div>
    <section className="catalog-panel admin-ops-panel report-movement-panel"><div className="catalog-panel-header"><div><h2>Stock movement and waste</h2><p>Sample activity categories</p></div><span className="admin-panel-icon"><BarChart3 size={17} /></span></div><div className="report-movement-grid">{demoReportMovements.map((movement) => <article className="report-movement-row" key={movement.label}><div><strong>{movement.label}</strong><span>{movement.value}</span></div><span className="report-bar-track"><i style={{ width: movement.width }} /></span></article>)}</div><p className="catalog-table-footnote">Ingredient units, waste valuation, and recipe cost summaries require user-defined backend rules.</p></section>
  </AdminLayout>
}

