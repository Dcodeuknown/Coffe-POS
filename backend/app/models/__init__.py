"""Load all ORM models so string-based foreign keys resolve in shared metadata."""

from app.models.base import Base
from app.models.ingredient import Ingredient
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.models.menu_variant import MenuVariant
from app.models.modifier import Modifier
from app.models.modifier_group import ModifierGroup
from app.models.modifier_ingredient_effect import ModifierIngredientEffect
from app.models.payment import Payment
from app.models.recipe_ingredient import RecipeIngredient
from app.models.recipe_version import RecipeVersion
from app.models.roles import Role
from app.models.sale import Sale
from app.models.sale_ingredient_consumption import SaleIngredientConsumption
from app.models.sale_item import SaleItem
from app.models.sale_item_modifier import SaleItemModifier
from app.models.stock_movement import StockMovement
from app.models.stock_receipt import StockReceipt
from app.models.stock_receipt_item import StockReceiptItem
from app.models.supplier import Supplier
from app.models.user import User
from app.models.variant_modifier_group import VariantModifierGroup

__all__ = [
    "Base",
    "Ingredient",
    "MenuCategory",
    "MenuItem",
    "MenuVariant",
    "Modifier",
    "ModifierGroup",
    "ModifierIngredientEffect",
    "Payment",
    "RecipeIngredient",
    "RecipeVersion",
    "Role",
    "Sale",
    "SaleIngredientConsumption",
    "SaleItem",
    "SaleItemModifier",
    "StockMovement",
    "StockReceipt",
    "StockReceiptItem",
    "Supplier",
    "User",
    "VariantModifierGroup",
]
