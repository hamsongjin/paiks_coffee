# Simple Admin PRD

Project: `paiks_coffee`  
Status: Planning only  
Last updated: 2026-05-14

## Purpose

Build a simple kiosk/store-operations admin page for fast catalog CRUD.

This project does not need general user login. The first admin version will also skip admin login and allow direct `/admin` access during early development.

The admin should focus on quickly managing the menu data that the kiosk uses:

- Products
- Categories
- Options
- Product-option links
- Sold-out state
- Display state
- Order lookup
- Order cancellation

## Non-Goals

Excluded from the first admin version:

- General user login
- Admin login
- Role-based permissions
- `admin_users`
- Audit logs
- Complex RLS design
- Approval workflows
- Customer account management
- Advanced order operations beyond lookup and cancel

## Current Database Context

Use the existing catalog tables as much as possible.

| Table | Current Role | Admin Use |
| --- | --- | --- |
| `goods` | Product master | Product CRUD, sold-out, display/delete flag |
| `goods_cate` | Category master | Category CRUD |
| `options` | Option master | Option CRUD, sold-out |
| `options_group` | Product-option mapping | Connect products and options |
| `order` | Order header | Order lookup and status change |
| `order_goods` | Order item | Order detail lookup and item status sync |

Known DB facts:

- Foreign keys are not currently defined.
- `goods.goods_no` is the product primary key.
- `goods_cate.cate_cd` is the category primary key.
- `options.opt_no` is the option primary key.
- `options_group` connects `goods.goods_no` and `options.opt_no`.
- `options_group` currently has duplicate `(goods_no, opt_no)` mappings.
- Current DB uses `order_state`; MVP design uses the clearer name `order_status`. If the existing table is kept as-is, map `order_status` in code to `order_state` in DB.

## Phase 1 Admin Scope

### Product CRUD

Admins can:

- View product list
- Search products
- Filter by category
- Create product
- Edit product
- Soft-hide product from kiosk using existing `del_fl`
- Toggle sold-out using `soldout_fl`
- Toggle new/best flags
- Manage connected options

Product fields:

- `goods_no`
- `cate_cd`
- `goods_nm`
- `goods_en_nm`
- `goods_price`
- `ice_fl`
- `best_fl`
- `new_fl`
- `soldout_fl`
- `del_fl`

### Category CRUD

Admins can:

- View categories
- Create category
- Edit category name
- Delete category only when no products use it

Category fields:

- `cate_cd`
- `cate_nm`

### Option CRUD

Admins can:

- View options
- Search options
- Filter by option type
- Create option
- Edit option
- Toggle sold-out
- Delete option only when no products use it

Option fields:

- `opt_no`
- `opt_nm`
- `opt_en_nm`
- `opt_type`
- `opt_price`
- `opt_max_cnt`
- `soldout_fl`

### Product-Option Link Management

Admins can:

- Open a product's option management screen
- See currently connected options
- Add options to the product
- Remove options from the product
- Prevent duplicate option connections in the UI

This uses existing `options_group`.

### Sold-Out State Management

Admins can:

- Mark product sold out: `goods.soldout_fl = 'y'`
- Restore product sale: `goods.soldout_fl = 'n'`
- Mark option sold out: `options.soldout_fl = 'y'`
- Restore option sale: `options.soldout_fl = 'n'`

### Display State Management

Use the existing `goods.del_fl` for product exposure in Phase 1:

- `del_fl = 'n'`: visible in kiosk menu
- `del_fl = 'y'`: hidden from kiosk menu

For categories and options, no display flag currently exists. Phase 1 should avoid hiding categories/options unless a column is added later.

### Order Lookup

Admins can:

- View order list
- Filter by order status
- Search by `order_no`
- View order detail
- See ordered items
- See payment method, total price, created time, and current status

This is a kiosk/store admin function, not customer account order history. There is no user login or customer profile relation.

### Order Cancellation

Admins can cancel an order by changing status. Cancel must not delete order rows.

Allowed status values:

- `pending`
- `cooking`
- `completed`
- `canceled`

Cancellation rule:

- `pending` -> `canceled`
- `cooking` -> `canceled`
- `completed` should not be canceled in the basic MVP
- `canceled` remains canceled

If the current DB column is `order_state`, the application should treat it as `order_status` in code and map the value into `order_state` until a later migration renames or adds a column.

## Admin Menu Structure

Simple first version:

```text
/admin
  Products
  Categories
  Options
  Orders
```

Product detail/edit screen includes product-option connection management.

Optional later menus:

- Settings

## Screen Requirements

### `/admin`

Simple dashboard with links and counts:

- Products count
- Hidden products count
- Sold-out products count
- Categories count
- Options count
- Sold-out options count
- Pending orders count
- Cooking orders count

### `/admin/products`

Product list with:

- Search
- Category filter
- Sold-out filter
- Hidden filter
- Create button
- Edit action
- Sold-out toggle
- Hide/show toggle

### `/admin/products/new`

Product create form.

Required fields:

- `goods_no`
- `cate_cd`
- `goods_nm`
- `goods_en_nm`
- `goods_price`

### `/admin/products/[goodsNo]`

Product edit form plus option link management.

Sections:

- Basic product fields
- State flags
- Connected options
- Add/remove options

### `/admin/categories`

Category list with:

- Category code
- Category name
- Product count
- Create button
- Edit action

### `/admin/categories/new`

Category create form.

### `/admin/categories/[cateCd]`

Category edit form.

### `/admin/options`

Option list with:

- Search
- Type filter
- Sold-out filter
- Create button
- Edit action
- Sold-out toggle

### `/admin/options/new`

Option create form.

### `/admin/options/[optNo]`

Option edit form.

### `/admin/orders`

Order list with:

- Search by `order_no`
- Status filter
- Date filter
- Payment method
- Total price
- Created time
- Cancel action for cancelable orders

### `/admin/orders/[orderNo]`

Order detail screen with:

- Order number
- Order status
- Payment method
- Total price
- Created/updated time
- Ordered items
- Selected options text from `order_goods.goods_options`
- Cancel action if status is `pending` or `cooking`

## Data Rules

### Product Rules

- Product creation must check that `goods_no` is unique.
- Product `cate_cd` must exist in `goods_cate`.
- `goods_price` must be non-negative.
- Flags must be stored as `y` or `n`.
- Product deletion should be soft hide through `del_fl`, not hard delete.

### Category Rules

- `cate_cd` must be unique.
- Prefer existing code format such as `001`, `002`.
- Do not delete a category if any product uses it.
- Changing `cate_cd` is risky; prefer editing only `cate_nm`.

### Option Rules

- `opt_price` must be non-negative.
- `opt_max_cnt` should be empty or positive.
- `soldout_fl` must be `y` or `n`.
- Do not delete an option if any `options_group` row uses it.

### Product-Option Rules

- Do not create duplicate `(goods_no, opt_no)` mappings.
- Current DB already has 5 duplicate mappings, so the admin UI should dedupe display results.
- Removing a product-option link deletes only the `options_group` row, not the product or option.

### Order Rules

- Orders are never deleted from admin.
- Canceling an order means changing status to `canceled`.
- Basic status flow is `pending` -> `cooking` -> `completed`.
- `pending` and `cooking` can be changed to `canceled`.
- `completed` cannot be canceled in the basic MVP.
- `canceled` cannot return to another status in the basic MVP.
- If using the current DB schema, write status values to `order.order_state`.
- If order item status should mirror the order, also update `order_goods.order_state` for the same `order_no`.

## Implementation Priority

1. `/admin` dashboard
2. Product list and edit
3. Product sold-out and hide/show toggles
4. Category list and edit
5. Option list and edit
6. Option sold-out toggle
7. Product-option connection management
8. Order list
9. Order detail
10. Order cancel status update
11. Product create
12. Category create
13. Option create

## Main Risks

| Risk | Impact | Simple Mitigation |
| --- | --- | --- |
| No admin login initially | Anyone with URL can access admin | Accept only for local/internal first version; add login later before public deployment |
| RLS disabled | Browser writes can be risky | For first version, use server-side admin routes and do not expose write helpers casually |
| No foreign keys | Invalid references can be saved | Validate in server code before writes |
| Duplicate option links | Duplicate options in UI | Dedupe in reads and block duplicates on save |
| Hard deletes | Broken menu/order references | Prefer soft hide and block deletes when referenced |
| Cancel implemented as delete | Lost sales/order history | Use status update to `canceled` only |
| `order_state` vs `order_status` naming | Confusing implementation | Use `order_status` in app types and map to current `order_state` DB column |
