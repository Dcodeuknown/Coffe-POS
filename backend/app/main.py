from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.models.menu_variant import MenuVariant
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.sale_ingredient_consumption import SaleIngredientConsumption
from app.models.roles import Role
from app.models.user import User
from app.models.supplier import Supplier
from app.models.ingredient import Ingredient
from app.models.stock_movement import StockMovement
from app.models.stock_receipt import StockReceipt
from app.models.stock_receipt_item import StockReceiptItem
from app.models.recipe_ingredient import RecipeIngredient
from app.models.recipe_version import RecipeVersion


app = FastAPI(title="Bahug Nawung Coffe POS API")

# Allow the Vite development frontend to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer(auto_error=False)

# Canonical factors are relative to grams, milliliters, or individual pieces.
MEASUREMENT_UNITS = {
    "kg": ("mass", Decimal("1000")),
    "kilogram": ("mass", Decimal("1000")),
    "kilograms": ("mass", Decimal("1000")),
    "g": ("mass", Decimal("1")),
    "gram": ("mass", Decimal("1")),
    "grams": ("mass", Decimal("1")),
    "l": ("volume", Decimal("1000")),
    "liter": ("volume", Decimal("1000")),
    "liters": ("volume", Decimal("1000")),
    "litre": ("volume", Decimal("1000")),
    "litres": ("volume", Decimal("1000")),
    "ml": ("volume", Decimal("1")),
    "milliliter": ("volume", Decimal("1")),
    "milliliters": ("volume", Decimal("1")),
    "millilitre": ("volume", Decimal("1")),
    "millilitres": ("volume", Decimal("1")),
    "pc": ("count", Decimal("1")),
    "pcs": ("count", Decimal("1")),
    "piece": ("count", Decimal("1")),
    "pieces": ("count", Decimal("1")),
    "ea": ("count", Decimal("1")),
    "each": ("count", Decimal("1")),
    "unit": ("count", Decimal("1")),
    "units": ("count", Decimal("1")),
    "ct": ("count", Decimal("1")),
    "count": ("count", Decimal("1")),
    "counts": ("count", Decimal("1")),
}
PIECE_UNITS = {"pc", "pcs", "piece", "pieces", "ea", "each", "unit", "units", "ct", "count", "counts"}


def is_piece_unit(unit: str) -> bool:
    return unit.strip().casefold() in PIECE_UNITS


def require_whole_pieces(quantity: Decimal, unit: str, field_name: str) -> None:
    if is_piece_unit(unit) and quantity != quantity.to_integral_value():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be a whole number when the unit is pieces",
        )


def measurement_factors(source_unit: str, base_unit: str, field_name: str) -> tuple[Decimal, Decimal]:
    source_key = source_unit.strip().casefold()
    base_key = base_unit.strip().casefold()
    if not source_key or not base_key:
        raise HTTPException(status_code=422, detail=f"{field_name} and the ingredient base unit are required")
    source_spec = MEASUREMENT_UNITS.get(source_key)
    base_spec = MEASUREMENT_UNITS.get(base_key)
    if source_spec is None and source_key == base_key:
        return Decimal("1"), Decimal("1")
    if source_spec is None or base_spec is None or source_spec[0] != base_spec[0]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"{field_name} '{source_unit}' cannot be converted to the ingredient base unit "
                f"'{base_unit}'. Use matching units, kg/g, L/ml, or a piece alias."
            ),
        )
    return source_spec[1], base_spec[1]


def convert_quantity_to_base(quantity: Decimal, source_unit: str, base_unit: str, field_name: str) -> Decimal:
    source_factor, base_factor = measurement_factors(source_unit, base_unit, field_name)
    converted = quantity * source_factor / base_factor
    # Keep sub-gram/sub-milliliter recipe quantities when the base unit is kg/L.
    normalized = converted.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    if normalized != converted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is too precise to store in the ingredient base unit '{base_unit}'",
        )
    require_whole_pieces(normalized, base_unit, field_name)
    return normalized


def convert_unit_cost_to_base(unit_cost: Decimal, source_unit: str, base_unit: str, field_name: str) -> Decimal:
    source_factor, base_factor = measurement_factors(source_unit, base_unit, field_name)
    if is_piece_unit(base_unit) and unit_cost != unit_cost.quantize(Decimal("0.01")):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cost per piece must be entered in currency cents (for example, 1.00 per piece)",
        )
    converted = unit_cost * base_factor / source_factor
    normalized = converted.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    if normalized != converted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} produces a cost too precise for the ingredient base unit '{base_unit}'",
        )
    return normalized


# Add all Pydantic models below this line.
class LoginRequest(BaseModel):
    username: str
    password: str
    audience: Literal["admin", "cashier"] | None = None


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str


class CurrentUserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role_id: int
    is_active: bool


# Response schema: FastAPI validates and documents each category returned by the API.
class MenuCategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool


class MenuCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    
# Request schema: validates a variant label and a price with the database's precision.
class MenuVariantCreate(BaseModel):
    variant_name: str = Field(min_length=1, max_length=155)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


# Request schema: validates a menu item and any initial priced variants.
class MenuItemCreate(BaseModel):
    category_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=450)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    variants: list[MenuVariantCreate] = Field(default_factory=list)


class MenuItemUpdate(BaseModel):
    category_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=450)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    
    
class MenuVariantUpdate(BaseModel):
    variant_name: str | None = Field(default=None, min_length=1, max_length=155)
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    is_active: bool | None = None
    
# Response schema: defines the supplier information returned to an admin.
class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_person: str | None
    phone: str | None
    email: str | None
    address: str | None
    is_active: bool
    created_at: datetime    

# Request schema: validates the supplier details sent by an admin.
class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=155)
    contact_person: str | None = Field(default=None, max_length=155)
    phone: str | None = Field(default=None, max_length=45)
    email: str | None = Field(default=None, max_length=155)
    address: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=155)
    contact_person: str | None = Field(default=None, max_length=155)
    phone: str | None = Field(default=None, max_length=45)
    email: str | None = Field(default=None, max_length=155)
    address: str | None = None
    is_active: bool | None = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None


class CashierRoleCreate(BaseModel):
    description: str | None = Field(default="Cashier role", max_length=255)


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=155)
    full_name: str = Field(min_length=1, max_length=155)
    password: str = Field(min_length=8, max_length=128)
    role_id: int = Field(gt=0)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=155)
    role_id: int | None = Field(default=None, gt=0)
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role_id: int
    role_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
# Request schema: accepts the ingredient details, excluding stock quantity.
class IngredientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=155)
    base_unit: str = Field(min_length=1, max_length=155)
    low_stock_threshold: Decimal = Field(
        ge=0,
        max_digits=15,
        decimal_places=6,
    )

# Defines which ingredient details admins can partially update.
class IngredientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=155)
    low_stock_threshold: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=15,
        decimal_places=6,
    )
    is_active: bool | None = None


# Response schema: describes the saved ingredient returned by the API.
class IngredientResponse(BaseModel):
    id: int
    name: str
    base_unit: str
    current_quantity: Decimal
    low_stock_threshold: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Each line item specifies how much of one ingredient was received and its cost.
class StockReceiptItemCreate(BaseModel):
    ingredient_id: int = Field(gt=0)
    quantity_received: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=6,
    )
    received_unit: str = Field(min_length=1, max_length=45)
    unit_cost: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=4,
    )


# The receipt header groups its supplier and receipt details with one or more items.
class StockReceiptCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    supplier_invoice_number: str | None = Field(default=None, max_length=155)
    received_at: datetime | None = None
    notes: str | None = None
    items: list[StockReceiptItemCreate] = Field(min_length=1)    
 
class StockReceiptItemResponse(BaseModel):
    id: int
    ingredient_id: int
    quantity_received: Decimal
    received_unit: str
    unit_cost: Decimal
    line_total: Decimal


class StockReceiptResponse(BaseModel):
    id: int
    supplier_id: int
    receipt_number: str
    supplier_invoice_number: str | None
    received_at: datetime
    status: str
    recorded_by: int
    notes: str | None
    created_at: datetime
    items: list[StockReceiptItemResponse]


# Request schema for correcting stock to the quantity physically counted.
class StockAdjustmentCreate(BaseModel):
    ingredient_id: int = Field(gt=0)
    counted_quantity: Decimal = Field(ge=0, max_digits=15, decimal_places=6)
    reason: str = Field(min_length=1, max_length=255)
    notes: str | None = None


# Request schema for recording stock discarded as waste.
class StockWasteCreate(BaseModel):
    ingredient_id: int = Field(gt=0)
    quantity_wasted: Decimal = Field(gt=0, max_digits=15, decimal_places=6)
    reason: str = Field(min_length=1, max_length=255)
    notes: str | None = None


# Response schema for one auditable stock movement in the inventory ledger.
class StockMovementResponse(BaseModel):
    id: int
    ingredient_id: int
    ingredient_name: str
    base_unit: str
    movement_type: str
    quantity_change: Decimal
    reason: str | None
    created_at: datetime
    receipt_number: str | None
    supplier_name: str | None


class SaleItemCreate(BaseModel):
    menu_variant_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=999)


class SaleCreate(BaseModel):
    payment_method: Literal["cash", "card", "ewallet"]
    cash_tendered: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    items: list[SaleItemCreate] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    id: int
    menu_variant_id: int
    item_name: str
    variant_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class SaleResponse(BaseModel):
    id: int
    sale_number: str
    user_id: int
    cashier_name: str
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    completed_at: datetime | None
    payment_method: str
    payment_status: str
    payment_amount: Decimal
    items: list[SaleItemResponse]


class CashierStockRequirementResponse(BaseModel):
    ingredient_id: int
    ingredient_name: str
    base_unit: str
    quantity_per_serving: Decimal
    current_quantity: Decimal
    is_active: bool


class CashierMenuVariantResponse(BaseModel):
    id: int
    variant_name: str
    price: Decimal
    has_recipe: bool
    stock_requirements: list[CashierStockRequirementResponse] = Field(default_factory=list)


class CashierMenuItemResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: str | None
    variants: list[CashierMenuVariantResponse]
   
# Each line describes one ingredient used by a recipe version.
class RecipeIngredientCreate(BaseModel):
    ingredient_id: int = Field(gt=0)
    quantity_required: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=6,
    )
    unit: str = Field(min_length=1, max_length=45)


# Request schema for a new version of a menu variant's recipe.
class RecipeVersionCreate(BaseModel):
    effective_from: datetime | None = None
    ingredients: list[RecipeIngredientCreate] = Field(min_length=1)


class RecipeIngredientResponse(BaseModel):
    id: int
    ingredient_id: int
    quantity_required: Decimal
    unit: str


class RecipeVersionResponse(BaseModel):
    id: int
    menu_variant_id: int
    version_number: int
    effective_from: datetime
    created_by: int
    created_at: datetime
    ingredients: list[RecipeIngredientResponse]    

@app.get("/")
async def read_root():
    return {"message": "Bahug Nawung Coffe POS API"}


@app.get("/health/database")
def database_health(db: Session = Depends(get_db)):
    result = db.scalar(text("SELECT 1"))
    return {"status": "ok", "database_check": result}


@app.post("/auth/login", response_model=AccessTokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # Find the account matching this login name.
    matching_users = db.scalars(
        select(User).where(User.username == credentials.username)
    ).all()

    # Refuse missing or duplicate usernames so login never picks an ambiguous account.
    if len(matching_users) != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = matching_users[0]

    # Verify the password and reject inactive accounts with the same generic response.
    if not verify_password(credentials.password, user.password_hash) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = db.get(Role, user.role_id)
    required_role = "Admin" if credentials.audience == "admin" else "Cashier"
    if role is None or (credentials.audience is not None and role.name != required_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"A {required_role} account is required for this sign-in page",
        )

    return AccessTokenResponse(
        access_token=create_access_token(user.id),
        token_type="bearer",
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except (InvalidTokenError, TypeError, ValueError):
        # InvalidTokenError covers expired, malformed, or incorrectly signed tokens.
        raise unauthorized

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized

    return user


@app.get("/auth/me", response_model=CurrentUserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role_id": current_user.role_id,
        "is_active": bool(current_user.is_active),
    }

# This endpoint requires a valid bearer token before its function can run.
# response_model documents and validates the list of category objects sent to the client.
@app.get(
    "/menu/categories",
    response_model=list[MenuCategoryResponse],
    dependencies=[Depends(get_current_user)],
)
def list_menu_categories(db: Session = Depends(get_db)):
    # Only active categories are shown to POS users.
    categories = db.scalars(
        select(MenuCategory)
        .where(MenuCategory.is_active == 1)
        .order_by(MenuCategory.name)
    ).all()

    # Convert MariaDB's 0/1 active value into a JSON true/false value.
    return [
        MenuCategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            is_active=bool(category.is_active),
        )
        for category in categories
    ]

# These schemas describe the item and variant data returned to the POS.
class MenuVariantResponse(BaseModel):
    id: int
    variant_name: str
    price: Decimal
    is_active: bool = True
    recipe_cost: Decimal | None = None


class MenuItemResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: str | None
    image_url: str | None
    variants: list[MenuVariantResponse]
    is_active: bool = True
    
    


# A valid bearer token is required to view the menu.
@app.get(
    "/menu/items",
    response_model=list[MenuItemResponse],
    dependencies=[Depends(get_current_user)],
)
def list_menu_items(db: Session = Depends(get_db)):
    # Return active items that belong to an active category.
    items = db.scalars(
        select(MenuItem)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItem.is_active == 1,
            MenuCategory.is_active == 1,
        )
        .order_by(MenuItem.name)
    ).all()

    if not items:
        return []

    item_ids = [item.id for item in items]

    # Fetch active variants in one query, then group them under each menu item.
    variants = db.scalars(
        select(MenuVariant)
        .where(
            MenuVariant.menu_item_id.in_(item_ids),
            MenuVariant.is_active == 1,
        )
        .order_by(MenuVariant.menu_item_id, MenuVariant.price)
    ).all()

    variants_by_item: dict[int, list[MenuVariantResponse]] = {
        item.id: [] for item in items
    }

    for variant in variants:
        variants_by_item[variant.menu_item_id].append(
            MenuVariantResponse(
                id=variant.id,
                variant_name=variant.variant_name,
                price=variant.price,
            )
        )

    return [
        MenuItemResponse(
            id=item.id,
            category_id=item.category_id,
            name=item.name,
            description=item.description,
            image_url=item.image_url,
            variants=variants_by_item[item.id],
        )
        for item in items
    ]

# Request schema: validates category data sent by an admin.
class MenuCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


def get_admin_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    # Look up the role record so access is based on its name, not a fixed role ID.
    role = db.get(Role, current_user.role_id)

    if role is None or role.name != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )

    return current_user


def get_cashier_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    # Allow Admins to help at the register; all other cashier routes require Cashier.
    role = db.get(Role, current_user.role_id)
    if role is None or role.name not in {"Admin", "Cashier"}:
        raise HTTPException(status_code=403, detail="Cashier role required")
    return current_user


@app.get("/admin/roles", response_model=list[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    roles = db.scalars(select(Role).order_by(Role.name)).all()
    return [RoleResponse(id=role.id, name=role.name, description=role.description) for role in roles]


@app.post("/admin/roles/cashier", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_cashier_role(
    role_data: CashierRoleCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    # This project currently supports only Admin and Cashier permission sets.
    role = db.scalar(select(Role).where(Role.name == "Cashier"))
    if role is not None:
        raise HTTPException(status_code=409, detail="Cashier role already exists")
    role = Role(
        name="Cashier",
        description=(role_data.description or "Cashier role").strip() or "Cashier role",
        created_at=datetime.now(),
    )
    db.add(role)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cashier role already exists")
    db.refresh(role)
    return RoleResponse(id=role.id, name=role.name, description=role.description)


@app.get("/admin/users", response_model=list[UserResponse])
def list_admin_users(
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    rows = db.execute(
        select(User, Role.name)
        .join(Role, Role.id == User.role_id)
        .order_by(User.full_name, User.username)
    ).all()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role_id=user.role_id,
            role_name=role_name,
            is_active=bool(user.is_active),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        for user, role_name in rows
    ]


@app.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    username = user_data.username.strip()
    full_name = user_data.full_name.strip()
    if not username or not full_name:
        raise HTTPException(status_code=422, detail="Username and full name cannot be blank")
    role = db.get(Role, user_data.role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    now = datetime.now()
    user = User(
        username=username,
        full_name=full_name,
        password_hash=hash_password(user_data.password),
        role_id=role.id,
        is_active=1,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists")
    db.refresh(user)
    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=role.name,
        is_active=bool(user.is_active),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@app.patch("/admin/users/{user_id}", response_model=UserResponse)
def update_admin_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    user = db.scalar(select(User).where(User.id == user_id).with_for_update())
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    updates = user_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide user fields to update")

    current_role = db.get(Role, user.role_id)
    new_role = db.get(Role, updates["role_id"]) if updates.get("role_id") is not None else current_role
    if updates.get("role_id") is not None and new_role is None:
        raise HTTPException(status_code=404, detail="Role not found")
    will_deactivate = updates.get("is_active") is False
    will_remove_admin = current_role is not None and current_role.name == "Admin" and (
        will_deactivate or (new_role is not None and new_role.name != "Admin")
    )
    if will_remove_admin:
        active_admin_count = db.scalar(
            select(func.count(User.id))
            .join(Role, Role.id == User.role_id)
            .where(User.is_active == 1, Role.name == "Admin")
        )
        if active_admin_count <= 1:
            raise HTTPException(status_code=409, detail="The last active Admin account cannot be disabled or downgraded")
    if user.id == admin_user.id and will_deactivate:
        raise HTTPException(status_code=409, detail="You cannot deactivate your own account")

    if "full_name" in updates:
        full_name = updates["full_name"]
        if full_name is None or not full_name.strip():
            raise HTTPException(status_code=422, detail="Full name cannot be blank")
        user.full_name = full_name.strip()
    if "role_id" in updates:
        user.role_id = new_role.id
    if "is_active" in updates:
        if updates["is_active"] is None:
            raise HTTPException(status_code=422, detail="User status cannot be null")
        user.is_active = int(updates["is_active"])
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    role = db.get(Role, user.role_id)
    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=role.name,
        is_active=bool(user.is_active),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@app.get("/admin/menu/categories", response_model=list[MenuCategoryResponse])
def list_admin_menu_categories(
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    categories = db.scalars(select(MenuCategory).order_by(MenuCategory.name)).all()
    return [
        MenuCategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            is_active=bool(category.is_active),
        )
        for category in categories
    ]


@app.get("/admin/menu/items", response_model=list[MenuItemResponse])
def list_admin_menu_items(
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    items = db.scalars(select(MenuItem).order_by(MenuItem.name)).all()
    if not items:
        return []

    item_ids = [item.id for item in items]
    variants = db.scalars(
        select(MenuVariant)
        .where(MenuVariant.menu_item_id.in_(item_ids))
        .order_by(MenuVariant.menu_item_id, MenuVariant.price)
    ).all()
    recipe_costs = calculate_menu_variant_recipe_costs(db, variants)
    variants_by_item: dict[int, list[MenuVariantResponse]] = {
        item.id: [] for item in items
    }
    for variant in variants:
        variants_by_item[variant.menu_item_id].append(
            MenuVariantResponse(
                id=variant.id,
                variant_name=variant.variant_name,
                price=variant.price,
                is_active=bool(variant.is_active),
                recipe_cost=recipe_costs.get(variant.id),
            )
        )

    return [
        MenuItemResponse(
            id=item.id,
            category_id=item.category_id,
            name=item.name,
            description=item.description,
            image_url=item.image_url,
            variants=variants_by_item[item.id],
            is_active=bool(item.is_active),
        )
        for item in items
    ]


def calculate_menu_variant_recipe_costs(
    db: Session,
    variants: list[MenuVariant],
) -> dict[int, Decimal | None]:
    """Calculate per-serving ingredient cost using weighted-average received costs."""
    if not variants:
        return {}

    now = datetime.now()
    variant_ids = [variant.id for variant in variants]
    recipe_versions = db.scalars(
        select(RecipeVersion)
        .where(
            RecipeVersion.menu_variant_id.in_(variant_ids),
            RecipeVersion.effective_from <= now,
        )
        .order_by(
            RecipeVersion.menu_variant_id,
            RecipeVersion.effective_from.desc(),
            RecipeVersion.version_number.desc(),
        )
    ).all()
    latest_recipe_by_variant = {}
    for recipe in recipe_versions:
        latest_recipe_by_variant.setdefault(recipe.menu_variant_id, recipe)
    recipe_ids = [recipe.id for recipe in latest_recipe_by_variant.values()]
    recipe_lines = db.scalars(
        select(RecipeIngredient)
        .where(RecipeIngredient.recipe_version_id.in_(recipe_ids))
        .order_by(RecipeIngredient.recipe_version_id, RecipeIngredient.id)
    ).all() if recipe_ids else []
    lines_by_recipe = {}
    for line in recipe_lines:
        lines_by_recipe.setdefault(line.recipe_version_id, []).append(line)

    ingredient_ids = {line.ingredient_id for line in recipe_lines}
    receipt_items = db.scalars(
        select(StockReceiptItem)
        .join(StockReceipt, StockReceipt.id == StockReceiptItem.stock_receipt_id)
        .where(
            StockReceipt.status == "received",
            StockReceiptItem.ingredient_id.in_(ingredient_ids),
        )
    ).all() if ingredient_ids else []
    received_totals = {}
    for receipt_item in receipt_items:
        quantity, cost = received_totals.get(
            receipt_item.ingredient_id,
            (Decimal("0"), Decimal("0")),
        )
        received_totals[receipt_item.ingredient_id] = (
            quantity + receipt_item.quantity_received,
            cost + (receipt_item.quantity_received * receipt_item.unit_cost),
        )
    average_costs = {
        ingredient_id: total_cost / total_quantity
        for ingredient_id, (total_quantity, total_cost) in received_totals.items()
        if total_quantity > 0
    }

    costs = {}
    for variant in variants:
        recipe = latest_recipe_by_variant.get(variant.id)
        lines = lines_by_recipe.get(recipe.id, []) if recipe else []
        if (
            not lines
            or any(line.ingredient_id not in average_costs for line in lines)
            or any(
                is_piece_unit(line.unit)
                and line.quantity_required != line.quantity_required.to_integral_value()
                for line in lines
            )
        ):
            costs[variant.id] = None
            continue
        total = sum(
            (line.quantity_required * average_costs[line.ingredient_id] for line in lines),
            Decimal("0"),
        )
        costs[variant.id] = total.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return costs

@app.post(
    "/ingredients",
    response_model=IngredientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ingredient(
    ingredient_data: IngredientCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    name = ingredient_data.name.strip()
    base_unit = ingredient_data.base_unit.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ingredient name cannot be blank",
        )

    if not base_unit:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Base unit cannot be blank",
        )
    require_whole_pieces(
        ingredient_data.low_stock_threshold,
        base_unit,
        "Low-stock threshold",
    )

    now = datetime.now()

    # Start at zero; stock will be added later through supplier receipts.
    ingredient = Ingredient(
        name=name,
        base_unit=base_unit,
        current_quantity=Decimal("0.000"),
        low_stock_threshold=ingredient_data.low_stock_threshold,
        is_active=1,
        created_at=now,
        updated_at=now,
    )
    db.add(ingredient)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An ingredient with this name already exists",
        )

    db.refresh(ingredient)

    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        base_unit=ingredient.base_unit,
        current_quantity=ingredient.current_quantity,
        low_stock_threshold=ingredient.low_stock_threshold,
        is_active=bool(ingredient.is_active),
        created_at=ingredient.created_at,
        updated_at=ingredient.updated_at,
    )
    

@app.patch(
    "/ingredients/{ingredient_id}",
    response_model=IngredientResponse,
)
def update_ingredient(
    ingredient_id: int,
    ingredient_data: IngredientUpdate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    # Lock the ingredient row while its editable details are being updated.
    ingredient = db.scalar(
        select(Ingredient)
        .where(Ingredient.id == ingredient_id)
        .with_for_update()
    )

    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingredient not found",
        )

    # Only fields included in the request body are changed.
    updates = ingredient_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide a name or low-stock threshold to update",
        )

    if "name" in updates:
        name = updates["name"]
        if name is None or not name.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ingredient name cannot be blank",
            )
        ingredient.name = name.strip()

    if "low_stock_threshold" in updates:
        threshold = updates["low_stock_threshold"]
        if threshold is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Low-stock threshold cannot be null",
            )
        require_whole_pieces(threshold, ingredient.base_unit, "Low-stock threshold")
        ingredient.low_stock_threshold = threshold

    if "is_active" in updates:
        is_active = updates["is_active"]
        if is_active is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Active status cannot be null",
            )
        ingredient.is_active = int(is_active)

    ingredient.updated_at = datetime.now()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An ingredient with this name already exists",
        )

    db.refresh(ingredient)

    # Return the updated ingredient, including its unchanged stock and base unit.
    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        base_unit=ingredient.base_unit,
        current_quantity=ingredient.current_quantity,
        low_stock_threshold=ingredient.low_stock_threshold,
        is_active=bool(ingredient.is_active),
        created_at=ingredient.created_at,
        updated_at=ingredient.updated_at,
    )    

@app.delete(
    "/ingredients/{ingredient_id}",
    response_model=IngredientResponse,
)
def deactivate_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    # Lock the row so its active status cannot change during this request.
    ingredient = db.scalar(
        select(Ingredient)
        .where(Ingredient.id == ingredient_id)
        .with_for_update()
    )

    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingredient not found",
        )

    # Mark the ingredient inactive instead of deleting its referenced history.
    if ingredient.is_active:
        ingredient.is_active = 0
        ingredient.updated_at = datetime.now()
        db.commit()
        db.refresh(ingredient)

    # Return the inactive ingredient so the client can confirm the result.
    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        base_unit=ingredient.base_unit,
        current_quantity=ingredient.current_quantity,
        low_stock_threshold=ingredient.low_stock_threshold,
        is_active=bool(ingredient.is_active),
        created_at=ingredient.created_at,
        updated_at=ingredient.updated_at,
    )    
    
    
@app.get(
    "/ingredients",
    response_model=list[IngredientResponse],
    dependencies=[Depends(get_admin_user)],
)
def list_ingredients(db: Session = Depends(get_db)):
    # Include inactive ingredients so admins can review the full inventory list.
    ingredients = db.scalars(
        select(Ingredient).order_by(Ingredient.name)
    ).all()

    return [
        IngredientResponse(
            id=ingredient.id,
            name=ingredient.name,
            base_unit=ingredient.base_unit,
            current_quantity=ingredient.current_quantity,
            low_stock_threshold=ingredient.low_stock_threshold,
            is_active=bool(ingredient.is_active),
            created_at=ingredient.created_at,
            updated_at=ingredient.updated_at,
        )
        for ingredient in ingredients
    ]    

@app.get(
    "/suppliers",
    response_model=list[SupplierResponse],
    dependencies=[Depends(get_admin_user)],
)
def list_suppliers(db: Session = Depends(get_db)):
    # Include inactive suppliers so admins can review the full supplier list.
    suppliers = db.scalars(
        select(Supplier).order_by(Supplier.name)
    ).all()

    return [
        SupplierResponse(
            id=supplier.id,
            name=supplier.name,
            contact_person=supplier.contact_person,
            phone=supplier.phone,
            email=supplier.email,
            address=supplier.address,
            is_active=bool(supplier.is_active),
            created_at=supplier.created_at,
        )
        for supplier in suppliers
    ]


@app.post(
    "/menu/categories",
    response_model=MenuCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_menu_category(
    category_data: MenuCategoryCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    name = category_data.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Category name cannot be blank",
        )

    # Build the new row; MariaDB's unique constraint prevents duplicate names.
    category = MenuCategory(
        name=name,
        description=category_data.description,
        is_active=1,
        created_at=datetime.now(),
    )
    db.add(category)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists",
        )

    db.refresh(category)

    return MenuCategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description,
        is_active=bool(category.is_active),
    )

@app.patch("/menu/categories/{category_id}", response_model=MenuCategoryResponse)
def update_menu_category(
    category_id: int,
    category_data: MenuCategoryUpdate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    category = db.scalar(
        select(MenuCategory).where(MenuCategory.id == category_id).with_for_update()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    updates = category_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide category fields to update")
    if "name" in updates:
        name = updates["name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=422, detail="Category name cannot be blank")
        category.name = name.strip()
    if "description" in updates:
        category.description = updates["description"]
    if "is_active" in updates:
        if updates["is_active"] is None:
            raise HTTPException(status_code=422, detail="Category status cannot be null")
        category.is_active = int(updates["is_active"])

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A category with this name already exists")
    db.refresh(category)
    return MenuCategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description,
        is_active=bool(category.is_active),
    )


@app.post(
    "/menu/items",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_menu_item(
    item_data: MenuItemCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    name = item_data.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Menu item name cannot be blank",
        )

    category = db.get(MenuCategory, item_data.category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot add a menu item to an inactive category",
        )

    now = datetime.now()
    normalized_variants = []
    for variant_data in item_data.variants:
        variant_name = variant_data.variant_name.strip()
        if not variant_name:
            raise HTTPException(status_code=422, detail="Variant name cannot be blank")
        normalized_variants.append((variant_name, variant_data.price))

    item = MenuItem(
        category_id=category.id,
        name=name,
        description=item_data.description,
        image_url=item_data.image_url,
        is_active=1,
        created_at=now,
        updated_at=now,
    )
    db.add(item)
    new_variants = []
    try:
        db.flush()
        for variant_name, price in normalized_variants:
            variant = MenuVariant(
                menu_item_id=item.id,
                variant_name=variant_name,
                price=price,
                is_active=1,
                created_at=now,
                updated_at=now,
            )
            db.add(variant)
            new_variants.append(variant)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not save menu item and variants")
    db.refresh(item)

    return MenuItemResponse(
        id=item.id,
        category_id=item.category_id,
        name=item.name,
        description=item.description,
        image_url=item.image_url,
        variants=[
            MenuVariantResponse(
                id=variant.id,
                variant_name=variant.variant_name,
                price=variant.price,
                is_active=bool(variant.is_active),
            )
            for variant in new_variants
        ],
        is_active=bool(item.is_active),
    )
    
@app.patch("/menu/items/{menu_item_id}", response_model=MenuItemResponse)
def update_menu_item(
    menu_item_id: int,
    item_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    item = db.scalar(
        select(MenuItem).where(MenuItem.id == menu_item_id).with_for_update()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")

    updates = item_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide menu item fields to update")
    if "name" in updates:
        name = updates["name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=422, detail="Menu item name cannot be blank")
        item.name = name.strip()
    if "description" in updates:
        item.description = updates["description"]
    if "image_url" in updates:
        item.image_url = updates["image_url"]
    if "category_id" in updates:
        category = db.get(MenuCategory, updates["category_id"])
        if category is None or not category.is_active:
            raise HTTPException(status_code=409, detail="Choose an active category")
        item.category_id = category.id
    if "is_active" in updates:
        if updates["is_active"] is None:
            raise HTTPException(status_code=422, detail="Menu item status cannot be null")
        if updates["is_active"]:
            category = db.get(MenuCategory, item.category_id)
            if category is None or not category.is_active:
                raise HTTPException(status_code=409, detail="Activate the item's category first")
        item.is_active = int(updates["is_active"])
    item.updated_at = datetime.now()
    db.commit()
    db.refresh(item)

    variants = db.scalars(
        select(MenuVariant)
        .where(MenuVariant.menu_item_id == item.id, MenuVariant.is_active == 1)
        .order_by(MenuVariant.price)
    ).all()
    return MenuItemResponse(
        id=item.id,
        category_id=item.category_id,
        name=item.name,
        description=item.description,
        image_url=item.image_url,
        variants=[
            MenuVariantResponse(
                id=variant.id,
                variant_name=variant.variant_name,
                price=variant.price,
                is_active=bool(variant.is_active),
            )
            for variant in variants
        ],
        is_active=bool(item.is_active),
    )


@app.post(
    "/menu/items/{menu_item_id}/variants",
    response_model=MenuVariantResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_menu_variant(
    menu_item_id: int,
    variant_data: MenuVariantCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    variant_name = variant_data.variant_name.strip()
    if not variant_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Variant name cannot be blank",
        )

    item = db.get(MenuItem, menu_item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    # Admins may configure variants while the item or its category is inactive.
    # POS availability is still controlled by the active item/category checks
    # when the cashier menu and sale are processed.
    now = datetime.now()
    variant = MenuVariant(
        menu_item_id=item.id,
        variant_name=variant_name,
        price=variant_data.price,
        is_active=1,
        created_at=now,
        updated_at=now,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    return MenuVariantResponse(
        id=variant.id,
        variant_name=variant.variant_name,
        price=variant.price,
    )
  
@app.patch("/menu/variants/{variant_id}", response_model=MenuVariantResponse)
def update_menu_variant(
    variant_id: int,
    variant_data: MenuVariantUpdate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    variant = db.scalar(
        select(MenuVariant).where(MenuVariant.id == variant_id).with_for_update()
    )
    if variant is None:
        raise HTTPException(status_code=404, detail="Menu variant not found")
    updates = variant_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide variant fields to update")
    if "variant_name" in updates:
        name = updates["variant_name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=422, detail="Variant name cannot be blank")
        variant.variant_name = name.strip()
    if "price" in updates:
        if updates["price"] is None:
            raise HTTPException(status_code=422, detail="Variant price cannot be null")
        variant.price = updates["price"]
    if "is_active" in updates:
        if updates["is_active"] is None:
            raise HTTPException(status_code=422, detail="Variant status cannot be null")
        variant.is_active = int(updates["is_active"])
    variant.updated_at = datetime.now()
    db.commit()
    db.refresh(variant)
    return MenuVariantResponse(
        id=variant.id,
        variant_name=variant.variant_name,
        price=variant.price,
        is_active=bool(variant.is_active),
    )


@app.post(
    "/suppliers",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    name = supplier_data.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Supplier name cannot be blank",
        )

    # New suppliers start active; the existing table has no default for is_active.
    supplier = Supplier(
        name=name,
        contact_person=supplier_data.contact_person,
        phone=supplier_data.phone,
        email=supplier_data.email,
        address=supplier_data.address,
        is_active=1,
        created_at=datetime.now(),
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return SupplierResponse(
        id=supplier.id,
        name=supplier.name,
        contact_person=supplier.contact_person,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
        is_active=bool(supplier.is_active),
        created_at=supplier.created_at,
    )    
    
@app.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(get_admin_user),
):
    supplier = db.scalar(
        select(Supplier).where(Supplier.id == supplier_id).with_for_update()
    )
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")

    updates = supplier_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide supplier fields to update")
    if "name" in updates:
        name = updates["name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=422, detail="Supplier name cannot be blank")
        supplier.name = name.strip()
    for field_name in ("contact_person", "phone", "email", "address"):
        if field_name in updates:
            value = updates[field_name]
            normalized_value = value.strip() or None if isinstance(value, str) else value
            setattr(supplier, field_name, normalized_value)
    if "is_active" in updates:
        if updates["is_active"] is None:
            raise HTTPException(status_code=422, detail="Supplier status cannot be null")
        supplier.is_active = int(updates["is_active"])

    db.commit()
    db.refresh(supplier)
    return SupplierResponse(
        id=supplier.id,
        name=supplier.name,
        contact_person=supplier.contact_person,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
        is_active=bool(supplier.is_active),
        created_at=supplier.created_at,
    )


@app.post(
    "/stock-receipts",
    response_model=StockReceiptResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_stock_receipt(
    receipt_data: StockReceiptCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    supplier = db.get(Supplier, receipt_data.supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    if not supplier.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Supplier is inactive",
        )

    # Lock the ingredient rows while quantities are being updated.
    ingredient_ids = {line.ingredient_id for line in receipt_data.items}
    ingredients = db.scalars(
        select(Ingredient)
        .where(Ingredient.id.in_(ingredient_ids))
        .order_by(Ingredient.id)
        .with_for_update()
    ).all()
    ingredients_by_id = {ingredient.id: ingredient for ingredient in ingredients}

    missing_ids = ingredient_ids - ingredients_by_id.keys()
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient not found: {sorted(missing_ids)}",
        )

    # Validate every line before writing any receipt data.
    projected_quantities = {
        ingredient_id: ingredient.current_quantity
        for ingredient_id, ingredient in ingredients_by_id.items()
    }
    prepared_lines = []

    for line in receipt_data.items:
        ingredient = ingredients_by_id[line.ingredient_id]
        if not ingredient.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ingredient '{ingredient.name}' is inactive",
            )

        received_unit = line.received_unit.strip()
        if not received_unit:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Received unit cannot be blank",
            )

        require_whole_pieces(line.quantity_received, received_unit, "Received quantity")
        base_quantity = convert_quantity_to_base(
            line.quantity_received,
            received_unit,
            ingredient.base_unit,
            f"Received unit for '{ingredient.name}'",
        )
        base_unit_cost = convert_unit_cost_to_base(
            line.unit_cost,
            received_unit,
            ingredient.base_unit,
            f"Received unit for '{ingredient.name}'",
        )
        new_quantity = projected_quantities[line.ingredient_id] + base_quantity
        if new_quantity > Decimal("999999999.999"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Quantity exceeds the database limit for '{ingredient.name}'",
            )
        projected_quantities[line.ingredient_id] = new_quantity

        line_total = (line.quantity_received * line.unit_cost).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
        if line_total > Decimal("9999999999.99"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Receipt line total exceeds the database limit",
            )

        prepared_lines.append((line, ingredient, base_quantity, base_unit_cost, line_total))

    now = datetime.now()
    received_at = receipt_data.received_at or now
    if received_at.tzinfo is not None:
        received_at = received_at.astimezone().replace(tzinfo=None)

    invoice_number = receipt_data.supplier_invoice_number
    if invoice_number is not None:
        invoice_number = invoice_number.strip() or None

    receipt = StockReceipt(
        supplier_id=supplier.id,
        # Use a temporary unique value until the database assigns the receipt ID.
        receipt_number=f"PENDING-{uuid4().hex}",
        supplier_invoice_number=invoice_number,
        received_at=received_at,
        status="received",
        recorded_by=admin_user.id,
        notes=receipt_data.notes,
        created_at=now,
    )

    response_items = []

    try:
        db.add(receipt)
        db.flush()

        # Generate a stable, unique receipt number from the saved row's ID.
        receipt_number = f"RCPT-{now:%Y%m%d}-{receipt.id:06d}"
        receipt.receipt_number = receipt_number
        db.flush()

        for line, ingredient, base_quantity, base_unit_cost, line_total in prepared_lines:
            # Store quantities and cost per unit in the ingredient's canonical base unit.
            receipt_item = StockReceiptItem(
                stock_receipt_id=receipt.id,
                ingredient_id=ingredient.id,
                quantity_received=base_quantity,
                received_unit=ingredient.base_unit,
                unit_cost=base_unit_cost,
                line_total=line_total,
            )
            db.add(receipt_item)
            db.flush()

            ingredient.current_quantity += base_quantity
            ingredient.updated_at = now

            # Record the increase separately so stock changes remain auditable.
            db.add(
                StockMovement(
                    ingredient_id=ingredient.id,
                    movement_type="receipt",
                    quantity_change=base_quantity,
                    stock_receipt_item_id=receipt_item.id,
                    recorded_by=admin_user.id,
                    reason=f"Stock receipt {receipt_number}",
                    created_at=now,
                )
            )

            response_items.append(
                StockReceiptItemResponse(
                    id=receipt_item.id,
                    ingredient_id=receipt_item.ingredient_id,
                    quantity_received=receipt_item.quantity_received,
                    received_unit=receipt_item.received_unit,
                    unit_cost=receipt_item.unit_cost,
                    line_total=receipt_item.line_total,
                )
            )

        response = StockReceiptResponse(
            id=receipt.id,
            supplier_id=receipt.supplier_id,
            receipt_number=receipt.receipt_number,
            supplier_invoice_number=receipt.supplier_invoice_number,
            received_at=receipt.received_at,
            status=receipt.status,
            recorded_by=receipt.recorded_by,
            notes=receipt.notes,
            created_at=receipt.created_at,
            items=response_items,
        )

        db.commit()
        return response

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Receipt could not be saved because a related record conflicts with existing data",
        )    
        

@app.get(
    "/stock-receipts",
    response_model=list[StockReceiptResponse],
    dependencies=[Depends(get_admin_user)],
)
def list_stock_receipts(db: Session = Depends(get_db)):
    # Show newest receipts first.
    receipts = db.scalars(
        select(StockReceipt).order_by(
            StockReceipt.received_at.desc(),
            StockReceipt.id.desc(),
        )
    ).all()

    if not receipts:
        return []

    receipt_ids = [receipt.id for receipt in receipts]
    receipt_items = db.scalars(
        select(StockReceiptItem)
        .where(StockReceiptItem.stock_receipt_id.in_(receipt_ids))
        .order_by(StockReceiptItem.stock_receipt_id, StockReceiptItem.id)
    ).all()

    items_by_receipt: dict[int, list[StockReceiptItemResponse]] = {
        receipt.id: [] for receipt in receipts
    }

    for item in receipt_items:
        items_by_receipt[item.stock_receipt_id].append(
            StockReceiptItemResponse(
                id=item.id,
                ingredient_id=item.ingredient_id,
                quantity_received=item.quantity_received,
                received_unit=item.received_unit,
                unit_cost=item.unit_cost,
                line_total=item.line_total,
            )
        )

    return [
        StockReceiptResponse(
            id=receipt.id,
            supplier_id=receipt.supplier_id,
            receipt_number=receipt.receipt_number,
            supplier_invoice_number=receipt.supplier_invoice_number,
            received_at=receipt.received_at,
            status=receipt.status,
            recorded_by=receipt.recorded_by,
            notes=receipt.notes,
            created_at=receipt.created_at,
            items=items_by_receipt[receipt.id],
        )
        for receipt in receipts
    ]        
   
@app.post("/stock-adjustments", response_model=IngredientResponse)
def create_stock_adjustment(
    adjustment_data: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    # Lock the ingredient so a count correction cannot race another stock change.
    ingredient = db.scalar(
        select(Ingredient)
        .where(Ingredient.id == adjustment_data.ingredient_id)
        .with_for_update()
    )
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if not ingredient.is_active:
        raise HTTPException(status_code=409, detail="Ingredient is inactive")
    require_whole_pieces(adjustment_data.counted_quantity, ingredient.base_unit, "Counted quantity")

    reason = adjustment_data.reason.strip()
    if not reason:
        raise HTTPException(status_code=422, detail="A reason is required")

    # The form supplies the physical count; this delta is what the ledger records.
    quantity_change = adjustment_data.counted_quantity - ingredient.current_quantity
    if quantity_change == 0:
        raise HTTPException(
            status_code=409,
            detail="Count matches current stock; no adjustment is needed",
        )

    notes = adjustment_data.notes.strip() if adjustment_data.notes else ""
    movement_reason = f"{reason}: {notes}" if notes else reason
    now = datetime.now()
    ingredient.current_quantity = adjustment_data.counted_quantity
    ingredient.updated_at = now
    db.add(
        StockMovement(
            ingredient_id=ingredient.id,
            movement_type="adjustment",
            quantity_change=quantity_change,
            recorded_by=admin_user.id,
            reason=movement_reason,
            created_at=now,
        )
    )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not save the stock adjustment")

    db.refresh(ingredient)
    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        base_unit=ingredient.base_unit,
        current_quantity=ingredient.current_quantity,
        low_stock_threshold=ingredient.low_stock_threshold,
        is_active=bool(ingredient.is_active),
        created_at=ingredient.created_at,
        updated_at=ingredient.updated_at,
    )


@app.post("/stock-waste", response_model=IngredientResponse)
def create_stock_waste(
    waste_data: StockWasteCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    # Lock the ingredient so waste cannot subtract the same stock twice concurrently.
    ingredient = db.scalar(
        select(Ingredient)
        .where(Ingredient.id == waste_data.ingredient_id)
        .with_for_update()
    )
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if not ingredient.is_active:
        raise HTTPException(status_code=409, detail="Ingredient is inactive")
    require_whole_pieces(waste_data.quantity_wasted, ingredient.base_unit, "Waste quantity")

    reason = waste_data.reason.strip()
    if not reason:
        raise HTTPException(status_code=422, detail="A waste reason is required")
    if waste_data.quantity_wasted > ingredient.current_quantity:
        raise HTTPException(
            status_code=409,
            detail="Waste quantity cannot exceed the current on-hand quantity",
        )

    notes = waste_data.notes.strip() if waste_data.notes else ""
    movement_reason = f"{reason}: {notes}" if notes else reason
    now = datetime.now()
    ingredient.current_quantity -= waste_data.quantity_wasted
    ingredient.updated_at = now
    db.add(
        StockMovement(
            ingredient_id=ingredient.id,
            movement_type="waste",
            quantity_change=-waste_data.quantity_wasted,
            recorded_by=admin_user.id,
            reason=movement_reason,
            created_at=now,
        )
    )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not save the waste movement")

    db.refresh(ingredient)
    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        base_unit=ingredient.base_unit,
        current_quantity=ingredient.current_quantity,
        low_stock_threshold=ingredient.low_stock_threshold,
        is_active=bool(ingredient.is_active),
        created_at=ingredient.created_at,
        updated_at=ingredient.updated_at,
    )


@app.get(
    "/stock-movements",
    response_model=list[StockMovementResponse],
    dependencies=[Depends(get_admin_user)],
)
def list_stock_movements(db: Session = Depends(get_db)):
    # Join optional receipt data so the UI can show receipt and supplier references.
    rows = db.execute(
        select(
            StockMovement,
            Ingredient.name,
            Ingredient.base_unit,
            StockReceipt.receipt_number,
            Supplier.name,
        )
        .join(Ingredient, Ingredient.id == StockMovement.ingredient_id)
        .outerjoin(
            StockReceiptItem,
            StockReceiptItem.id == StockMovement.stock_receipt_item_id,
        )
        .outerjoin(StockReceipt, StockReceipt.id == StockReceiptItem.stock_receipt_id)
        .outerjoin(Supplier, Supplier.id == StockReceipt.supplier_id)
        .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
        .limit(200)
    ).all()

    return [
        StockMovementResponse(
            id=movement.id,
            ingredient_id=movement.ingredient_id,
            ingredient_name=ingredient_name,
            base_unit=base_unit,
            movement_type=movement.movement_type,
            quantity_change=movement.quantity_change,
            reason=movement.reason,
            created_at=movement.created_at,
            receipt_number=receipt_number,
            supplier_name=supplier_name,
        )
        for movement, ingredient_name, base_unit, receipt_number, supplier_name in rows
    ]


@app.post(
    "/menu/variants/{menu_variant_id}/recipe-versions",
    response_model=RecipeVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recipe_version(
    menu_variant_id: int,
    recipe_data: RecipeVersionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    # Lock the variant so simultaneous requests don't normally choose the same version.
    variant = db.scalar(
        select(MenuVariant)
        .where(MenuVariant.id == menu_variant_id)
        .with_for_update()
    )
    if variant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu variant not found",
        )
    if not variant.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot add a recipe to an inactive menu variant",
        )

    item = db.get(MenuItem, variant.menu_item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    # Recipe preparation is allowed while the item/category is inactive. The
    # cashier menu and sale endpoints enforce whether it can actually be sold.

    ingredient_ids = [line.ingredient_id for line in recipe_data.ingredients]
    if len(ingredient_ids) != len(set(ingredient_ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="List each ingredient only once in a recipe version",
        )

    # Lock and validate all ingredients before creating any recipe rows.
    ingredients = db.scalars(
        select(Ingredient)
        .where(Ingredient.id.in_(ingredient_ids))
        .order_by(Ingredient.id)
        .with_for_update()
    ).all()
    ingredients_by_id = {ingredient.id: ingredient for ingredient in ingredients}

    missing_ids = set(ingredient_ids) - ingredients_by_id.keys()
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient not found: {sorted(missing_ids)}",
        )

    normalized_recipe_lines = []
    for line in recipe_data.ingredients:
        ingredient = ingredients_by_id[line.ingredient_id]
        if not ingredient.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ingredient '{ingredient.name}' is inactive",
            )

        unit = line.unit.strip()
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Recipe ingredient unit cannot be blank",
            )

        base_quantity = convert_quantity_to_base(
            line.quantity_required,
            unit,
            ingredient.base_unit,
            f"Recipe unit for '{ingredient.name}'",
        )
        normalized_recipe_lines.append((line, ingredient, base_quantity))

    latest_version = db.scalar(
        select(func.max(RecipeVersion.version_number)).where(
            RecipeVersion.menu_variant_id == menu_variant_id
        )
    )
    version_number = (latest_version or 0) + 1

    now = datetime.now()
    effective_from = recipe_data.effective_from or now
    if effective_from.tzinfo is not None:
        effective_from = effective_from.astimezone().replace(tzinfo=None)

    recipe_version = RecipeVersion(
        menu_variant_id=menu_variant_id,
        version_number=version_number,
        effective_from=effective_from,
        created_by=admin_user.id,
        created_at=now,
    )
    response_ingredients = []

    try:
        db.add(recipe_version)
        db.flush()

        for line, ingredient, base_quantity in normalized_recipe_lines:
            recipe_ingredient = RecipeIngredient(
                recipe_version_id=recipe_version.id,
                ingredient_id=ingredient.id,
                quantity_required=base_quantity,
                unit=ingredient.base_unit,
            )
            db.add(recipe_ingredient)
            db.flush()

            response_ingredients.append(
                RecipeIngredientResponse(
                    id=recipe_ingredient.id,
                    ingredient_id=recipe_ingredient.ingredient_id,
                    quantity_required=recipe_ingredient.quantity_required,
                    unit=recipe_ingredient.unit,
                )
            )

        response = RecipeVersionResponse(
            id=recipe_version.id,
            menu_variant_id=recipe_version.menu_variant_id,
            version_number=recipe_version.version_number,
            effective_from=recipe_version.effective_from,
            created_by=recipe_version.created_by,
            created_at=recipe_version.created_at,
            ingredients=response_ingredients,
        )

        db.commit()
        return response

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recipe version could not be saved; retry the request",
        )    


@app.get(
    "/menu/variants/{menu_variant_id}/recipe-versions",
    response_model=list[RecipeVersionResponse],
    dependencies=[Depends(get_current_user)],
)
def list_recipe_versions(menu_variant_id: int, db: Session = Depends(get_db)):
    # Confirm the variant exists before looking up its saved recipe history.
    variant = db.get(MenuVariant, menu_variant_id)
    if variant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu variant not found",
        )

    # Keep every version so older recipes remain available for historical reference.
    versions = db.scalars(
        select(RecipeVersion)
        .where(RecipeVersion.menu_variant_id == menu_variant_id)
        .order_by(RecipeVersion.version_number)
    ).all()
    if not versions:
        return []

    version_ids = [version.id for version in versions]
    recipe_ingredients = db.scalars(
        select(RecipeIngredient)
        .where(RecipeIngredient.recipe_version_id.in_(version_ids))
        .order_by(RecipeIngredient.recipe_version_id, RecipeIngredient.id)
    ).all()

    # Group the ingredient rows under their recipe version for the API response.
    ingredients_by_version: dict[int, list[RecipeIngredientResponse]] = {
        version.id: [] for version in versions
    }
    for ingredient in recipe_ingredients:
        ingredients_by_version[ingredient.recipe_version_id].append(
            RecipeIngredientResponse(
                id=ingredient.id,
                ingredient_id=ingredient.ingredient_id,
                quantity_required=ingredient.quantity_required,
                unit=ingredient.unit,
            )
        )

    return [
        RecipeVersionResponse(
            id=version.id,
            menu_variant_id=version.menu_variant_id,
            version_number=version.version_number,
            effective_from=version.effective_from,
            created_by=version.created_by,
            created_at=version.created_at,
            ingredients=ingredients_by_version[version.id],
        )
        for version in versions
    ]

# Creates a completed POS transaction and deducts its recipe ingredients atomically.
@app.post("/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    cashier: User = Depends(get_cashier_user),
):
    variant_ids = [line.menu_variant_id for line in sale_data.items]
    if len(variant_ids) != len(set(variant_ids)):
        raise HTTPException(status_code=422, detail="Combine quantities for matching menu variants")

    now = datetime.now()
    variants = db.scalars(
        select(MenuVariant)
        .where(MenuVariant.id.in_(variant_ids))
        .order_by(MenuVariant.id)
        .with_for_update()
    ).all()
    variants_by_id = {variant.id: variant for variant in variants}
    if set(variant_ids) != variants_by_id.keys():
        raise HTTPException(status_code=404, detail="A selected menu variant was not found")

    items_by_variant = {}
    for variant in variants:
        menu_item = db.get(MenuItem, variant.menu_item_id)
        category = db.get(MenuCategory, menu_item.category_id) if menu_item else None
        if (
            not variant.is_active
            or menu_item is None
            or not menu_item.is_active
            or category is None
            or not category.is_active
        ):
            raise HTTPException(status_code=409, detail="A selected menu item is no longer available")
        if len(menu_item.name) > 155 or len(variant.variant_name) > 155:
            raise HTTPException(status_code=422, detail="Menu item and variant names must fit the sale record fields")
        items_by_variant[variant.id] = menu_item

    # Resolve the effective recipe for each selected variant before calculating stock use.
    recipes_by_variant = {}
    recipe_ids = []
    for variant_id in variant_ids:
        recipe = db.scalar(
            select(RecipeVersion)
            .where(
                RecipeVersion.menu_variant_id == variant_id,
                RecipeVersion.effective_from <= now,
            )
            .order_by(RecipeVersion.effective_from.desc(), RecipeVersion.version_number.desc())
            .limit(1)
        )
        if recipe is None:
            raise HTTPException(
                status_code=409,
                detail=f"'{items_by_variant[variant_id].name}' has no effective recipe and cannot be sold yet",
            )
        recipes_by_variant[variant_id] = recipe
        recipe_ids.append(recipe.id)

    recipe_lines = db.scalars(
        select(RecipeIngredient)
        .where(RecipeIngredient.recipe_version_id.in_(recipe_ids))
        .order_by(RecipeIngredient.ingredient_id)
    ).all()
    lines_by_recipe = {}
    required_by_ingredient = {}
    for line in recipe_lines:
        lines_by_recipe.setdefault(line.recipe_version_id, []).append(line)
    for request_line in sale_data.items:
        recipe = recipes_by_variant[request_line.menu_variant_id]
        lines = lines_by_recipe.get(recipe.id, [])
        if not lines:
            raise HTTPException(status_code=409, detail="A selected menu variant has an empty recipe")
        for line in lines:
            required_by_ingredient[line.ingredient_id] = (
                required_by_ingredient.get(line.ingredient_id, Decimal("0"))
                + line.quantity_required * request_line.quantity
            )

    ingredients = db.scalars(
        select(Ingredient)
        .where(Ingredient.id.in_(required_by_ingredient))
        .order_by(Ingredient.id)
        .with_for_update()
    ).all()
    ingredients_by_id = {ingredient.id: ingredient for ingredient in ingredients}
    for ingredient_id, required_quantity in required_by_ingredient.items():
        ingredient = ingredients_by_id.get(ingredient_id)
        if ingredient is None or not ingredient.is_active:
            raise HTTPException(status_code=409, detail="A recipe ingredient is no longer active")
        if ingredient.current_quantity < required_quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Not enough {ingredient.name}: need {required_quantity} {ingredient.base_unit}, "
                    f"have {ingredient.current_quantity}"
                ),
            )

    quantity_by_variant = {line.menu_variant_id: line.quantity for line in sale_data.items}
    subtotal = sum(
        (variants_by_id[variant_id].price * quantity for variant_id, quantity in quantity_by_variant.items()),
        Decimal("0.00"),
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if subtotal <= 0 or subtotal > Decimal("9999999999.99"):
        raise HTTPException(status_code=422, detail="Sale total is outside the supported amount range")
    if sale_data.payment_method == "cash":
        if sale_data.cash_tendered is None or sale_data.cash_tendered < subtotal:
            raise HTTPException(status_code=422, detail="Cash received must cover the sale total")

    sale = Sale(
        sale_number=f"PENDING-{uuid4().hex}",
        user_id=cashier.id,
        status="completed",
        subtotal=subtotal,
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        total_amount=subtotal,
        created_at=now,
        completed_at=now,
    )
    db.add(sale)
    try:
        db.flush()
        sale.sale_number = f"SALE-{now:%Y%m%d}-{sale.id:06d}"
        db.flush()

        saved_items = []
        for request_line in sale_data.items:
            variant = variants_by_id[request_line.menu_variant_id]
            menu_item = items_by_variant[variant.id]
            recipe = recipes_by_variant[variant.id]
            line_total = (variant.price * request_line.quantity).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            sale_item = SaleItem(
                sale_id=sale.id,
                menu_variant_id=variant.id,
                recipe_version_id=recipe.id,
                item_name_snapshot=menu_item.name,
                variant_name_snapshot=variant.variant_name,
                unit_price=variant.price,
                quantity=request_line.quantity,
                line_total=line_total,
            )
            db.add(sale_item)
            db.flush()
            saved_items.append(
                SaleItemResponse(
                    id=sale_item.id,
                    menu_variant_id=variant.id,
                    item_name=menu_item.name,
                    variant_name=variant.variant_name,
                    unit_price=variant.price,
                    quantity=request_line.quantity,
                    line_total=line_total,
                )
            )

            for recipe_line in lines_by_recipe[recipe.id]:
                consumed = recipe_line.quantity_required * request_line.quantity
                ingredient = ingredients_by_id[recipe_line.ingredient_id]
                ingredient.current_quantity -= consumed
                ingredient.updated_at = now
                consumption = SaleIngredientConsumption(
                    sale_item_id=sale_item.id,
                    ingredient_id=ingredient.id,
                    recipe_version_id=recipe.id,
                    quantity_consumed=consumed,
                    unit=recipe_line.unit,
                    created_at=now,
                )
                db.add(consumption)
                db.flush()
                db.add(
                    StockMovement(
                        ingredient_id=ingredient.id,
                        movement_type="sale_use",
                        quantity_change=-consumed,
                        sale_ingredient_consumption_id=consumption.id,
                        recorded_by=cashier.id,
                        reason=f"Sale {sale.sale_number}",
                        created_at=now,
                    )
                )

        payment = Payment(
            sale_id=sale.id,
            payment_method=sale_data.payment_method,
            amount=subtotal,
            status="paid",
            paid_at=now,
            created_at=now,
        )
        db.add(payment)
        response = SaleResponse(
            id=sale.id,
            sale_number=sale.sale_number,
            user_id=cashier.id,
            cashier_name=cashier.full_name,
            status=sale.status,
            subtotal=sale.subtotal,
            discount_amount=sale.discount_amount,
            tax_amount=sale.tax_amount,
            total_amount=sale.total_amount,
            created_at=sale.created_at,
            completed_at=sale.completed_at,
            payment_method=payment.payment_method,
            payment_status=payment.status,
            payment_amount=payment.amount,
            items=saved_items,
        )
        db.commit()
        return response
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Sale could not be saved; no stock was deducted")
    except Exception:
        db.rollback()
        raise


# Lists completed sales; cashiers see their own records and admins can review all.
@app.get("/sales", response_model=list[SaleResponse])
def list_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_cashier_user),
):
    role = db.get(Role, current_user.role_id)
    query = select(Sale, User.full_name).join(User, User.id == Sale.user_id)
    if role is None or role.name != "Admin":
        query = query.where(Sale.user_id == current_user.id)
    rows = db.execute(query.order_by(Sale.created_at.desc(), Sale.id.desc()).limit(500)).all()
    return _sale_response_rows(db, rows)


# Reads one completed sale and its saved receipt details.
@app.get("/sales/{sale_id}", response_model=SaleResponse)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_cashier_user),
):
    row = db.execute(
        select(Sale, User.full_name)
        .join(User, User.id == Sale.user_id)
        .where(Sale.id == sale_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    role = db.get(Role, current_user.role_id)
    if role is None or (role.name != "Admin" and row[0].user_id != current_user.id):
        raise HTTPException(status_code=403, detail="You cannot view this sale")
    return _sale_response_rows(db, [row])[0]


def _sale_response_rows(db: Session, rows) -> list[SaleResponse]:
    if not rows:
        return []
    sales = [row[0] for row in rows]
    sale_ids = [sale.id for sale in sales]
    items = db.scalars(
        select(SaleItem).where(SaleItem.sale_id.in_(sale_ids)).order_by(SaleItem.id)
    ).all()
    payments = db.scalars(
        select(Payment).where(Payment.sale_id.in_(sale_ids)).order_by(Payment.id)
    ).all()
    items_by_sale = {sale.id: [] for sale in sales}
    payments_by_sale = {sale.id: [] for sale in sales}
    for item in items:
        items_by_sale[item.sale_id].append(
            SaleItemResponse(
                id=item.id,
                menu_variant_id=item.menu_variant_id,
                item_name=item.item_name_snapshot,
                variant_name=item.variant_name_snapshot,
                unit_price=item.unit_price,
                quantity=item.quantity,
                line_total=item.line_total,
            )
        )
    for payment in payments:
        payments_by_sale[payment.sale_id].append(payment)
    result = []
    for sale, cashier_name in rows:
        sale_payments = payments_by_sale[sale.id]
        payment = sale_payments[0] if sale_payments else None
        if payment is None:
            continue
        result.append(
            SaleResponse(
                id=sale.id,
                sale_number=sale.sale_number,
                user_id=sale.user_id,
                cashier_name=cashier_name,
                status=sale.status,
                subtotal=sale.subtotal,
                discount_amount=sale.discount_amount,
                tax_amount=sale.tax_amount,
                total_amount=sale.total_amount,
                created_at=sale.created_at,
                completed_at=sale.completed_at,
                payment_method=payment.payment_method,
                payment_status=payment.status,
                payment_amount=payment.amount,
                items=items_by_sale[sale.id],
            )
        )
    return result

# Returns active cashier menu choices and indicates which variants have an effective recipe.
@app.get("/cashier/menu", response_model=list[CashierMenuItemResponse])
def cashier_menu(
    db: Session = Depends(get_db),
    _cashier: User = Depends(get_cashier_user),
):
    menu_items = db.scalars(
        select(MenuItem)
        .join(MenuCategory, MenuCategory.id == MenuItem.category_id)
        .where(MenuItem.is_active == 1, MenuCategory.is_active == 1)
        .order_by(MenuCategory.name, MenuItem.name)
    ).all()
    if not menu_items:
        return []

    item_ids = [item.id for item in menu_items]
    variants = db.scalars(
        select(MenuVariant)
        .where(MenuVariant.menu_item_id.in_(item_ids), MenuVariant.is_active == 1)
        .order_by(MenuVariant.menu_item_id, MenuVariant.price)
    ).all()
    variant_ids = [variant.id for variant in variants]
    now = datetime.now()
    recipe_versions = db.scalars(
        select(RecipeVersion)
        .where(
            RecipeVersion.menu_variant_id.in_(variant_ids),
            RecipeVersion.effective_from <= now,
        )
        .order_by(
            RecipeVersion.menu_variant_id,
            RecipeVersion.effective_from.desc(),
            RecipeVersion.version_number.desc(),
        )
    ).all() if variant_ids else []
    latest_recipe_by_variant = {}
    for recipe in recipe_versions:
        latest_recipe_by_variant.setdefault(recipe.menu_variant_id, recipe)
    recipe_ids = [recipe.id for recipe in latest_recipe_by_variant.values()]
    recipe_lines = db.scalars(
        select(RecipeIngredient).where(RecipeIngredient.recipe_version_id.in_(recipe_ids))
    ).all() if recipe_ids else []
    recipes_with_lines = {line.recipe_version_id for line in recipe_lines}
    lines_by_recipe = {}
    for line in recipe_lines:
        lines_by_recipe.setdefault(line.recipe_version_id, []).append(line)
    ingredient_ids = {line.ingredient_id for line in recipe_lines}
    ingredients_by_id = {
        ingredient.id: ingredient
        for ingredient in db.scalars(
            select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
        ).all()
    } if ingredient_ids else {}
    variants_by_item = {item.id: [] for item in menu_items}
    for variant in variants:
        recipe = latest_recipe_by_variant.get(variant.id)
        recipe_lines_for_variant = lines_by_recipe.get(recipe.id, []) if recipe else []
        variants_by_item[variant.menu_item_id].append(
            CashierMenuVariantResponse(
                id=variant.id,
                variant_name=variant.variant_name,
                price=variant.price,
                has_recipe=recipe is not None and recipe.id in recipes_with_lines,
                stock_requirements=[
                    CashierStockRequirementResponse(
                        ingredient_id=line.ingredient_id,
                        ingredient_name=ingredients_by_id[line.ingredient_id].name,
                        base_unit=ingredients_by_id[line.ingredient_id].base_unit,
                        quantity_per_serving=line.quantity_required,
                        current_quantity=ingredients_by_id[line.ingredient_id].current_quantity,
                        is_active=bool(ingredients_by_id[line.ingredient_id].is_active),
                    )
                    for line in recipe_lines_for_variant
                    if line.ingredient_id in ingredients_by_id
                ],
            )
        )
    return [
        CashierMenuItemResponse(
            id=item.id,
            category_id=item.category_id,
            name=item.name,
            description=item.description,
            variants=variants_by_item[item.id],
        )
        for item in menu_items
    ]
