-- Preserve sub-gram and sub-milliliter quantities in metric base units.
-- Run this once against the POS database before saving recipes with fractional g/ml.

ALTER TABLE ingredients
    MODIFY COLUMN current_quantity DECIMAL(15, 6) NOT NULL,
    MODIFY COLUMN low_stock_threshold DECIMAL(15, 6) NOT NULL;

ALTER TABLE recipe_ingredients
    MODIFY COLUMN quantity_required DECIMAL(15, 6) NOT NULL;

ALTER TABLE stock_receipt_items
    MODIFY COLUMN quantity_received DECIMAL(15, 6) NOT NULL;

ALTER TABLE stock_movements
    MODIFY COLUMN quantity_change DECIMAL(15, 6) NOT NULL;

ALTER TABLE sale_ingredient_consumptions
    MODIFY COLUMN quantity_consumed DECIMAL(15, 6) NOT NULL;

ALTER TABLE modifier_ingredient_effects
    MODIFY COLUMN quantity DECIMAL(15, 6) NOT NULL;
