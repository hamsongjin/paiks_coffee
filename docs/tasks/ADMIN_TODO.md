# Simple Admin TODO

Project: `paiks_coffee`  
Status: Planning only  
Last updated: 2026-05-14

## Rule

Phase 1 admin is a simple CRUD tool.

Do not implement:

- General user login
- Admin login
- Roles
- `admin_users`
- `audit_logs`
- Complex RLS policy work

Order lookup and order cancellation are included in MVP. Cancellation must be a status update, not deletion.

## Phase 0: Confirm Simple Admin Scope

- [ ] Confirm `/admin` can be open without login for early development.
- [ ] Confirm admin is for kiosk/store operation, not public user accounts.
- [ ] Confirm Phase 1 includes catalog CRUD plus order lookup/cancel.
- [ ] Confirm order status values: `pending`, `cooking`, `completed`, `canceled`.
- [ ] Confirm current DB `order_state` will be treated as app-level `order_status`.
- [ ] Confirm product images are not required for Phase 1.
- [ ] Confirm product display uses existing `goods.del_fl`.

## Phase 1: Data Safety Checks

- [ ] Keep existing tables: `goods`, `goods_cate`, `options`, `options_group`.
- [ ] Do not create new admin tables.
- [ ] Do not add migrations yet.
- [ ] Identify duplicate `options_group(goods_no, opt_no)` rows before implementing save.
- [ ] Make admin reads dedupe option mappings.
- [ ] Make admin writes block duplicate mappings.
- [ ] Block category delete when products exist.
- [ ] Block option delete when mappings exist.
- [ ] Use soft hide for products through `goods.del_fl`.
- [ ] Do not delete orders from admin.
- [ ] Cancel orders by updating status to `canceled`.
- [ ] Keep order item status in sync if using `order_goods.order_state`.

## Phase 2: Admin Shell

- [ ] Create `/admin` route.
- [ ] Create simple admin layout.
- [ ] Add navigation: Products, Categories, Options, Orders.
- [ ] Add dashboard counts.
- [ ] Add pending/cooking order counts.
- [ ] Add basic loading states.
- [ ] Add basic error states.

## Phase 3: Products

- [ ] Build `/admin/products` list.
- [ ] Add product search.
- [ ] Add category filter.
- [ ] Add sold-out filter.
- [ ] Add hidden/visible filter using `del_fl`.
- [ ] Add `/admin/products/new`.
- [ ] Add product create action.
- [ ] Add `/admin/products/[goodsNo]`.
- [ ] Add product edit action.
- [ ] Add product sold-out toggle.
- [ ] Add product visible/hidden toggle using `del_fl`.
- [ ] Validate `cate_cd` exists before save.
- [ ] Validate `goods_price >= 0`.
- [ ] Convert UI booleans to `y`/`n`.

## Phase 4: Categories

- [ ] Build `/admin/categories` list.
- [ ] Show product count per category.
- [ ] Add `/admin/categories/new`.
- [ ] Add category create action.
- [ ] Add `/admin/categories/[cateCd]`.
- [ ] Add category edit action.
- [ ] Avoid editing `cate_cd` after creation.
- [ ] Add category delete action only if product count is 0.

## Phase 5: Options

- [ ] Build `/admin/options` list.
- [ ] Add option search.
- [ ] Add option type filter.
- [ ] Add sold-out filter.
- [ ] Show mapped product count per option.
- [ ] Add `/admin/options/new`.
- [ ] Add option create action.
- [ ] Add `/admin/options/[optNo]`.
- [ ] Add option edit action.
- [ ] Add option sold-out toggle.
- [ ] Validate `opt_price >= 0`.
- [ ] Validate `opt_max_cnt` is empty or positive.
- [ ] Add option delete action only if mapping count is 0.

## Phase 6: Product-Option Connections

- [ ] Add option connection section to `/admin/products/[goodsNo]`.
- [ ] Load current `options_group` mappings by `goods_no`.
- [ ] Dedupe current mappings before rendering.
- [ ] Load all options grouped by `opt_type`.
- [ ] Add checkbox/select UI for connected options.
- [ ] Validate selected options exist before save.
- [ ] Dedupe selected option IDs before save.
- [ ] Insert newly selected mappings.
- [ ] Delete removed mappings.
- [ ] Do not delete option master rows from this screen.

## Phase 7: Kiosk Read Behavior

- [ ] Customer/kiosk product list excludes `goods.del_fl = 'y'`.
- [ ] Sold-out products are shown disabled or hidden according to UI decision.
- [ ] Sold-out options are shown disabled or hidden according to UI decision.
- [ ] Product detail reads options through `options_group`.
- [ ] Product detail dedupes option mappings.

## Phase 8: Orders

- [ ] Build `/admin/orders` list.
- [ ] Add order search by `order_no`.
- [ ] Add status filter.
- [ ] Add date filter.
- [ ] Display `order_status` mapped from `order.order_state`.
- [ ] Display `payment_method`.
- [ ] Display `total_price`.
- [ ] Display item count from `order_goods`.
- [ ] Add cancel button for `pending` orders.
- [ ] Add cancel button for `cooking` orders.
- [ ] Hide/disable cancel button for `completed` orders.
- [ ] Hide/disable cancel button for `canceled` orders.
- [ ] Build `/admin/orders/[orderNo]` detail page.
- [ ] Display order header fields.
- [ ] Display order item rows from `order_goods`.
- [ ] Join item `goods_no` to current `goods` for product name.
- [ ] Display `goods_options` as text.
- [ ] Implement `cancelOrder(orderNo)` server action.
- [ ] Validate current status before cancel.
- [ ] Update `order.order_state` to `canceled`.
- [ ] Optionally update matching `order_goods.order_state` to `canceled`.
- [ ] Revalidate order list/detail after cancel.

## Phase 9: Later Improvements

- [ ] Add simple `/admin` password gate before public deployment.
- [ ] Add Supabase Auth later if needed.
- [ ] Add `sort_order` columns if manual ordering is required.
- [ ] Add category display flag if category hiding is required.
- [ ] Add option display/delete flag if option hiding is required.
- [ ] Clean duplicate `options_group` rows.
- [ ] Add unique constraint on `options_group(goods_no, opt_no)` after cleanup.
- [ ] Add foreign keys after data is clean.
- [ ] Consider adding `order_status` column or renaming `order_state` later.
- [ ] Consider adding order item snapshots later.
- [ ] Consider normalizing selected options later.

## Implementation Priority

1. Admin shell
2. Product list
3. Product edit
4. Sold-out and visible toggles
5. Category list/edit
6. Option list/edit
7. Product-option connection management
8. Order list/detail
9. Order cancel status update
10. Create forms
11. Safe delete guards
12. Later access protection

## Cautions

- `/admin` without login is only acceptable for early/internal use.
- Do not hard-delete products casually.
- Do not allow duplicate `options_group` mappings.
- Do not delete orders for cancellation.
- Use `canceled` status for order cancel.
- Treat current `order_state` as app-level `order_status` until schema changes.
- Do not rely on Supabase nested selects until FKs exist.
- Do not expose service role keys to browser code.
- Keep write operations server-side.
