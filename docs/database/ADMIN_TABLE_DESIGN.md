# Simple Admin Table Design

Project: `paiks_coffee`  
Status: Planning only  
Last updated: 2026-05-14

## Goal

Support a simple kiosk/store admin using the current catalog tables.

No new admin auth, role, or audit tables are required for Phase 1.

Removed from this simplified design:

- `admin_users`
- `admin_audit_logs`
- Complex role model
- Complex RLS policy matrix
- Order option normalization for Phase 1

## Existing Tables to Use

### `goods`

Use for product management.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `goods_no` | Product ID |
| `cate_cd` | Category selection |
| `goods_nm` | Korean product name |
| `goods_en_nm` | English product name |
| `goods_price` | Base price |
| `ice_fl` | HOT/ICED-style flag |
| `best_fl` | Best badge |
| `new_fl` | New badge |
| `soldout_fl` | Sold-out toggle |
| `del_fl` | Kiosk visibility/hide flag |
| `created_at` | Read-only metadata |
| `updated_at` | Read-only metadata |

Phase 1 behavior:

- `del_fl = 'n'`: visible product
- `del_fl = 'y'`: hidden product
- `soldout_fl = 'y'`: product cannot be selected
- `soldout_fl = 'n'`: product can be selected

### `goods_cate`

Use for category management.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `cate_cd` | Category ID |
| `cate_nm` | Category name |

Phase 1 behavior:

- Categories are visible if they exist.
- No category display/hide flag exists.
- Do not delete categories that have products.

### `options`

Use for option management.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `opt_no` | Option ID |
| `opt_nm` | Korean option name |
| `opt_en_nm` | English option name |
| `opt_type` | Option grouping label |
| `opt_price` | Additional option price |
| `opt_max_cnt` | Maximum selectable count |
| `soldout_fl` | Sold-out toggle |
| `created_at` | Read-only metadata |
| `updated_at` | Read-only metadata |

Phase 1 behavior:

- Options are visible if they exist and are connected to a product.
- `soldout_fl = 'y'`: option is shown disabled or unavailable.
- `soldout_fl = 'n'`: option can be selected.

### `options_group`

Use for product-option connections.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `seq` | Mapping row ID |
| `goods_no` | Connected product |
| `opt_no` | Connected option |
| `created_at` | Read-only metadata |

Phase 1 behavior:

- One product can have many options.
- One option can be connected to many products.
- The admin UI should show unique connected options per product.
- The admin save flow should prevent duplicate `(goods_no, opt_no)` pairs.

### `order`

Use for order lookup and order cancellation.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `seq` | Internal row ID |
| `order_no` | Business order number |
| `total_price` | Order total |
| `payment_method` | Payment method |
| `order_state` | Current DB status column |
| `created_at` | Order created time |
| `updated_at` | Last update time |

MVP naming:

- Use `order_status` in planning, UI labels, and application types.
- Map `order_status` to the current DB column `order_state` unless a later migration adds/renames the column.

Status values:

| order_status | Meaning |
| --- | --- |
| `pending` | Order received, not yet started |
| `cooking` | Store is preparing the order |
| `completed` | Order finished |
| `canceled` | Order canceled |

### `order_goods`

Use for order item detail.

Current columns:

| Column | Use in Admin |
| --- | --- |
| `seq` | Order item row ID |
| `order_no` | Parent order number |
| `goods_no` | Ordered product ID |
| `goods_options` | Selected options text |
| `order_state` | Item status column |
| `created_at` | Created time |
| `updated_at` | Updated time |

MVP behavior:

- Display line items by `order_no`.
- Join `goods_no` to `goods` in application code to show current product name.
- Show `goods_options` as stored text.
- When canceling an order, update item `order_state` to `canceled` as well if item-level status should stay aligned.

Known limitation:

- There is no quantity column.
- There are no product price/name snapshots.
- Selected options are stored as text, not normalized rows.
- This is acceptable for MVP lookup/cancel, but not ideal for advanced order reporting.

## New Tables

No new tables are required for Phase 1.

| Proposed Table | Phase 1 Decision |
| --- | --- |
| `admin_users` | Do not create |
| `admin_audit_logs` | Do not create |
| `order_goods_options` | Do not create |

## Optional Columns for Later

These are not required for Phase 1. Add them only if the UI needs them.

### `goods_cate`

| Column | Reason |
| --- | --- |
| `sort_order int4` | Manual category ordering |
| `display_fl varchar default 'y'` | Hide category without deleting |
| `created_at timestamptz` | Metadata consistency |
| `updated_at timestamptz` | Metadata consistency |

### `goods`

| Column | Reason |
| --- | --- |
| `sort_order int4` | Manual product ordering |
| `display_fl varchar default 'y'` | Separate visibility from soft delete |
| `image_url text` | Product image |
| `description text` | Product detail copy |

Note: Phase 1 can use existing `del_fl` instead of `display_fl`.

### `options`

| Column | Reason |
| --- | --- |
| `sort_order int4` | Manual option ordering |
| `display_fl varchar default 'y'` | Hide option without deleting |
| `del_fl varchar default 'n'` | Soft-delete option |

### `options_group`

| Column | Reason |
| --- | --- |
| `sort_order int4` | Product-specific option ordering |

### `order`

| Column | Reason |
| --- | --- |
| `order_status varchar` | Clearer status column name than `order_state`; optional later rename/addition |

If no migration is desired, keep using `order_state` and map it as `order_status` in code.

### `order_goods`

| Column | Reason |
| --- | --- |
| `quantity int4` | Multiple units of same product |
| `goods_nm_snapshot text` | Stable historical display |
| `goods_price_snapshot int4` | Stable historical price |

## Recommended Constraints for Later

Do not apply during this planning task.

After cleaning duplicate data:

```text
unique (goods_no, opt_no) on options_group
```

After confirming references:

```text
goods.cate_cd -> goods_cate.cate_cd
options_group.goods_no -> goods.goods_no
options_group.opt_no -> options.opt_no
order_goods.order_no -> order.order_no
order_goods.goods_no -> goods.goods_no
```

These constraints are useful, but Phase 1 can enforce references in server code first.

## Simple Read Models

### Product List

Read:

```text
goods
goods_cate
```

Join in application code by:

```text
goods.cate_cd = goods_cate.cate_cd
```

### Product Detail

Read:

```text
goods by goods_no
options_group by goods_no
options by opt_no
```

Because no FKs exist, use explicit queries and combine data in code.

### Option List

Read:

```text
options
options_group count by opt_no
```

The count is useful to decide whether an option can be safely deleted.

### Category List

Read:

```text
goods_cate
goods count by cate_cd
```

The count is useful to decide whether a category can be safely deleted.

### Order List

Read:

```text
order
order_goods count by order_no
```

Display:

- `order_no`
- `order_status` mapped from `order_state`
- `payment_method`
- `total_price`
- `created_at`
- item count

Filters:

- `order_status`
- date range
- `order_no`

### Order Detail

Read:

```text
order by order_no
order_goods by order_no
goods by goods_no
```

Because no FKs exist, combine rows in application code.

Use current product data for display in MVP. Add snapshot columns later if historical accuracy is required.

## Simple Write Rules

### Product Create/Update

Validate:

- `goods_no` unique for create
- `cate_cd` exists
- `goods_nm` is not empty
- `goods_en_nm` is not empty
- `goods_price >= 0`
- flags are `y` or `n`

Write to:

- `goods`

### Category Create/Update

Validate:

- `cate_cd` unique for create
- `cate_nm` is not empty

Write to:

- `goods_cate`

### Option Create/Update

Validate:

- `opt_nm` is not empty
- `opt_price >= 0`
- `opt_max_cnt` is null or greater than 0
- `soldout_fl` is `y` or `n`

Write to:

- `options`

### Product-Option Save

Validate:

- Product exists
- Every selected option exists
- Selected option IDs are unique

Write to:

- `options_group`

Recommended save flow:

1. Load current mappings for product.
2. Dedupe current mappings.
3. Compare current option IDs with desired option IDs.
4. Insert missing mappings.
5. Delete removed mappings.

### Order Cancel

Validate:

- Order exists.
- Current status is `pending` or `cooking`.
- Target status is `canceled`.

Write to:

- `order.order_state` using value `canceled`
- optionally `order_goods.order_state` for matching `order_no`

Do not delete:

- `order`
- `order_goods`

Status transition model:

```text
pending -> cooking -> completed
pending -> canceled
cooking -> canceled
completed -> no cancel in MVP
canceled -> terminal
```

## RLS Note

Phase 1 planning does not include a full RLS design.

Current risk remains:

- Several public tables have RLS disabled.
- If the app is deployed publicly with browser-side writes, admin operations can be exposed.

Simple Phase 1 recommendation:

- Keep writes in server-side Next.js routes/actions.
- Do not expose write utilities directly to customer-facing browser code.
- Add proper auth/RLS before making `/admin` public.
