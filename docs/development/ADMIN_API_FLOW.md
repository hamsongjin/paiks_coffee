# Simple Admin API Flow

Project: `paiks_coffee`  
Status: Planning only  
Last updated: 2026-05-14

## Assumptions

- This is a kiosk/store operations project.
- There is no general user login.
- Phase 1 admin does not require login.
- `/admin` is directly accessible during early development.
- No role system is used.
- No audit log is written.
- Existing catalog tables are used as-is.
- Order lookup and cancellation are included in the MVP.

Before public deployment, add at least a basic access gate for `/admin`.

## Recommended Next.js Routes

```text
app/
  admin/
    layout.tsx
    page.tsx
    products/
      page.tsx
      new/
        page.tsx
      [goodsNo]/
        page.tsx
    categories/
      page.tsx
      new/
        page.tsx
      [cateCd]/
        page.tsx
    options/
      page.tsx
      new/
        page.tsx
      [optNo]/
        page.tsx
    orders/
      page.tsx
      [orderNo]/
        page.tsx
```

Keep product-option connection management inside:

```text
/admin/products/[goodsNo]
```

## Data Access Pattern

Use server-side reads and writes where possible:

```text
Admin page/form
  -> Server Action or Route Handler
  -> Validate input
  -> Supabase query
  -> Revalidate admin/customer pages
```

Avoid direct client-side write calls for admin CRUD.

## Common Helpers

Recommended helper modules later:

```text
src/lib/admin/products.ts
src/lib/admin/categories.ts
src/lib/admin/options.ts
src/lib/admin/product-options.ts
src/lib/admin/orders.ts
src/lib/admin/flags.ts
```

Shared flag helpers:

```ts
const toDbFlag = (value: boolean) => (value ? "y" : "n");
const fromDbFlag = (value: string | null | undefined) => value === "y";
```

Use these for:

- `ice_fl`
- `best_fl`
- `new_fl`
- `soldout_fl`
- `del_fl`

## Dashboard Flow

Route:

```text
GET /admin
```

Reads:

- Product count from `goods`
- Hidden product count where `del_fl = 'y'`
- Sold-out product count where `soldout_fl = 'y'`
- Category count from `goods_cate`
- Option count from `options`
- Sold-out option count where `soldout_fl = 'y'`
- Pending order count where order status is `pending`
- Cooking order count where order status is `cooking`

No writes.

## Product Flows

### Product List

Route:

```text
GET /admin/products
```

Reads:

- `goods`
- `goods_cate`

Filters:

- Search by `goods_nm`, `goods_en_nm`, or `goods_no`
- `cate_cd`
- `soldout_fl`
- `del_fl`
- `best_fl`
- `new_fl`
- `ice_fl`

Join:

```text
goods.cate_cd = goods_cate.cate_cd
```

Because no DB foreign keys exist, join in application code or use explicit SQL/RPC later.

### Product Create

Route:

```text
GET /admin/products/new
POST action createProduct
```

Validate:

- `goods_no` is present and unique
- `cate_cd` exists
- `goods_nm` is not empty
- `goods_en_nm` is not empty
- `goods_price` is numeric and non-negative
- flags are converted to `y`/`n`

Write:

- Insert row into `goods`

After write:

- Redirect to `/admin/products/[goodsNo]` or `/admin/products`
- Revalidate product list and customer menu pages

### Product Edit

Route:

```text
GET /admin/products/[goodsNo]
POST action updateProduct
```

Reads:

- Product by `goods_no`
- Categories for select box
- Connected options through `options_group`
- All options for add/remove UI

Validate:

- Product exists
- `cate_cd` exists
- Price is non-negative
- flags are `y`/`n`

Write:

- Update `goods`

### Product Sold-Out Toggle

Action:

```text
toggleProductSoldOut(goodsNo, soldOut)
```

Write:

- Update `goods.soldout_fl`

### Product Display Toggle

Action:

```text
toggleProductVisible(goodsNo, visible)
```

Write:

- `visible = true` -> `goods.del_fl = 'n'`
- `visible = false` -> `goods.del_fl = 'y'`

## Category Flows

### Category List

Route:

```text
GET /admin/categories
```

Reads:

- `goods_cate`
- Product count grouped by `goods.cate_cd`

### Category Create

Route:

```text
GET /admin/categories/new
POST action createCategory
```

Validate:

- `cate_cd` is present
- `cate_cd` is unique
- `cate_nm` is not empty

Write:

- Insert row into `goods_cate`

### Category Edit

Route:

```text
GET /admin/categories/[cateCd]
POST action updateCategory
```

Recommended:

- Edit `cate_nm`
- Avoid changing `cate_cd`

Write:

- Update `goods_cate.cate_nm`

### Category Delete

Action:

```text
deleteCategory(cateCd)
```

Validate:

- No products exist with `goods.cate_cd = cateCd`

Write:

- Delete from `goods_cate`

If products exist, block deletion.

## Option Flows

### Option List

Route:

```text
GET /admin/options
```

Reads:

- `options`
- Product mapping count grouped by `options_group.opt_no`

Filters:

- Search by `opt_nm`, `opt_en_nm`, or `opt_no`
- `opt_type`
- `soldout_fl`

### Option Create

Route:

```text
GET /admin/options/new
POST action createOption
```

Validate:

- `opt_nm` is not empty
- `opt_price` is numeric and non-negative
- `opt_max_cnt` is empty or positive
- `soldout_fl` is `y`/`n`

Write:

- Insert row into `options`

### Option Edit

Route:

```text
GET /admin/options/[optNo]
POST action updateOption
```

Validate:

- Option exists
- Price is non-negative
- Max count is empty or positive

Write:

- Update `options`

### Option Sold-Out Toggle

Action:

```text
toggleOptionSoldOut(optNo, soldOut)
```

Write:

- Update `options.soldout_fl`

### Option Delete

Action:

```text
deleteOption(optNo)
```

Validate:

- No mappings exist in `options_group` for `opt_no`

Write:

- Delete from `options`

If mappings exist, block deletion.

## Product-Option Connection Flow

Route:

```text
GET /admin/products/[goodsNo]
POST action updateProductOptions
```

Reads:

- Product by `goods_no`
- Current mappings from `options_group`
- Option rows from `options`

UI:

- Show all options grouped by `opt_type`
- Mark connected options as checked
- Disable or label sold-out options

Save:

1. Validate product exists.
2. Validate every selected `opt_no` exists.
3. Dedupe selected option IDs.
4. Load current `options_group` rows for product.
5. Insert newly selected options.
6. Delete removed options.

Important:

- Do not insert duplicate `(goods_no, opt_no)` mappings.
- Do not delete option master rows.
- Dedupe current mappings before rendering because duplicates already exist.

## Order Flows

MVP order management is read-mostly:

- View orders.
- View order detail.
- Cancel orders by status update.

No order delete action exists.

### Status Naming

Planning and application code should use `order_status`.

Current DB has `order_state` on:

- `order.order_state`
- `order_goods.order_state`

Until a later migration changes the column name, map:

```text
order_status <-> order_state
```

Allowed statuses:

```text
pending
cooking
completed
canceled
```

Status flow:

```text
pending -> cooking -> completed
pending -> canceled
cooking -> canceled
completed -> terminal in MVP
canceled -> terminal
```

### Order List

Route:

```text
GET /admin/orders
```

Reads:

- `order`
- item count from `order_goods`

Filters:

- `order_status`
- `order_no`
- date range
- `payment_method`

Display:

- `order_no`
- `order_status`
- `total_price`
- `payment_method`
- `created_at`
- item count
- cancel action if status is `pending` or `cooking`

Raw SQL note:

- The table name is `order`.
- In raw SQL, use `public."order"`.
- In Supabase client calls, `.from("order")` is acceptable.

### Order Detail

Route:

```text
GET /admin/orders/[orderNo]
```

Reads:

1. Order row by `order_no`.
2. Order item rows from `order_goods`.
3. Current product rows from `goods` by `goods_no`.

Display:

- Order number
- Status
- Payment method
- Total price
- Created/updated time
- Item list
- Product name from current `goods`
- Selected options from `order_goods.goods_options`
- Item status from `order_goods.order_state`

MVP limitation:

- `goods_options` is stored text, so display it as-is.
- Product name and price snapshots do not exist, so detail may reflect current product data.

### Cancel Order

Action:

```text
cancelOrder(orderNo)
```

Validate:

- Order exists.
- Current status is `pending` or `cooking`.
- Current status is not `completed`.
- Current status is not `canceled`.

Write:

- Update `order.order_state` to `canceled`.
- Update `order.updated_at`.
- Update `order_goods.order_state` to `canceled` for the same `order_no` if item status is kept in sync.
- Update `order_goods.updated_at` if item rows are changed.

Do not:

- Delete order rows.
- Delete order item rows.
- Change product/menu tables during cancel.

After write:

- Revalidate `/admin/orders`.
- Revalidate `/admin/orders/[orderNo]`.

## Customer Menu Read Impact

Customer/kiosk menu should read:

```text
goods where del_fl = 'n'
goods_cate
options_group
options
```

Behavior:

- Hidden products are excluded by `del_fl = 'y'`.
- Sold-out products remain visible but disabled if desired.
- Sold-out options remain visible but disabled if desired.

## Deployment Caution

This simplified plan intentionally skips login.

Acceptable for:

- Local development
- Internal prototype
- Controlled store device network

Not acceptable for:

- Public internet deployment
- Shared production admin URL

Before public deployment, add one of:

- Simple password gate
- Supabase Auth admin login
- Network-level protection
- Middleware allowlist
