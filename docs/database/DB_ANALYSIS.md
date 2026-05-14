# Supabase DB Analysis

Project: `paiks_coffee`  
Project ID: `pgakjfcmjemrcdrcjpdy`  
Region: `ap-northeast-1`  
Postgres: `17.6.1.084`  
Analysis date: 2026-05-14

## Scope

This document is based on read-only inspection through Supabase MCP. No schema changes, migrations, data updates, or code edits were applied.

Foreign keys are not currently defined. Relationship analysis is therefore inferred from:

- Actual column names
- Primary key and unique constraints
- Row counts
- Sample data
- Repeated value patterns
- Orphan checks across likely key columns

## Discovered Tables

| Table | Rows | RLS | Purpose |
| --- | ---: | --- | --- |
| `public.goods` | 161 | Disabled | Product master data |
| `public.goods_cate` | 8 | Disabled | Product category master data |
| `public.options` | 37 | Disabled | Option master data |
| `public.options_group` | 426 | Disabled | Product-option mapping table |
| `public.order` | 0 | Enabled | Order header |
| `public.order_goods` | 0 | Disabled | Ordered product line items |

Important: Supabase reported RLS disabled on `goods`, `goods_cate`, `options`, `options_group`, and `order_goods`. These tables are exposed to Supabase client roles unless policies or server-only access patterns are used.

## Table Structures

### `public.goods`

Product master table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `cate_cd` | `varchar` | No | - | Category code. Likely references `goods_cate.cate_cd`. |
| `goods_no` | `int4` | No | - | Primary key. Product ID. |
| `goods_nm` | `varchar` | No | - | Korean product name. |
| `goods_en_nm` | `varchar` | No | - | English product name. |
| `goods_price` | `numeric` | No | - | Base product price. |
| `ice_fl` | `varchar` | Yes | `'n'` | `y`/`n` flag. Indicates iced item. |
| `best_fl` | `varchar` | Yes | `'n'` | `y`/`n` flag. |
| `new_fl` | `varchar` | Yes | `'n'` | `y`/`n` flag. |
| `soldout_fl` | `varchar` | Yes | `'n'` | `y`/`n` flag. |
| `del_fl` | `bpchar` | Yes | `'n'` | Soft-delete flag. |
| `created_at` | `timestamptz` | Yes | `now()` | Created timestamp. |
| `updated_at` | `timestamptz` | Yes | `now()` | Updated timestamp. |

Primary key: `goods_no`

Sample pattern:

- `goods_no` values use large numeric IDs such as `1000000001`.
- `cate_cd` values match category codes like `001`, `002`, etc.
- HOT/ICED variants are stored as separate products, e.g. `아메리카노(HOT)` and `아메리카노(ICED)`.
- `ice_fl` mirrors this variant behavior rather than representing a selectable option.

### `public.goods_cate`

Category master table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `cate_cd` | `varchar` | No | - | Primary key. Category code. |
| `cate_nm` | `varchar` | No | - | Category display name. |

Primary key: `cate_cd`

Observed categories:

| cate_cd | cate_nm | Product count |
| --- | --- | ---: |
| `001` | 커피 | 44 |
| `002` | 주스/에이드 | 18 |
| `003` | 스무디/쉐이크 | 14 |
| `004` | 음료 | 28 |
| `005` | 빽스치노 | 16 |
| `006` | 티 | 24 |
| `007` | 디저트 | 14 |
| `008` | 블랙펄 | 3 |

### `public.options`

Option master table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `opt_no` | `int4` | No | `nextval('"options_optNo_seq"')` | Primary key. Option ID. |
| `opt_nm` | `varchar` | No | - | Korean option name. |
| `opt_max_cnt` | `int4` | Yes | - | Maximum selectable count. |
| `opt_price` | `numeric` | No | - | Additional price. |
| `opt_type` | `varchar` | No | - | Option group/type label. |
| `soldout_fl` | `varchar` | Yes | `'n'` | `y`/`n` flag. |
| `created_at` | `timestamptz` | Yes | `now()` | Created timestamp. |
| `updated_at` | `timestamptz` | Yes | `now()` | Updated timestamp. |
| `opt_en_nm` | `varchar` | Yes | `''` | English option name. |

Primary key: `opt_no`

Observed option type distribution:

| opt_type | Count | Price range |
| --- | ---: | --- |
| `샷` | 2 | 0-500 |
| `선택` | 5 | 0-800 |
| `토핑` | 30 | 500-1200 |

Sample options include `샷추가`, `펄추가`, `헤이즐넛시럽 추가`, and other add-ons.

### `public.options_group`

Product-option mapping table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `seq` | `int4` | No | `nextval('optionsgroup_seq_seq')` | Primary key. Mapping row ID. |
| `goods_no` | `int4` | No | - | Likely references `goods.goods_no`. |
| `opt_no` | `int4` | No | - | Likely references `options.opt_no`. |
| `created_at` | `timestamptz` | Yes | `now()` | Created timestamp. |

Primary key: `seq`

Inferred role: join table between `goods` and `options`.

Observed issues:

- 426 mapping rows.
- No orphaned `goods_no`.
- No orphaned `opt_no`.
- 5 duplicate `(goods_no, opt_no)` pairs were found.

Duplicate pairs:

| goods_no | opt_no | Count |
| ---: | ---: | ---: |
| `1000000064` | `21` | 2 |
| `1000000106` | `4` | 2 |
| `1000000106` | `31` | 2 |
| `1000000142` | `4` | 2 |
| `1000000142` | `22` | 2 |

### `public.order`

Order header table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `seq` | `int4` | No | `nextval('order_seq_seq')` | Primary key. Internal order row ID. |
| `order_no` | `varchar` | No | - | Unique public/order business ID. |
| `total_price` | `int4` | Yes | - | Total order price. |
| `payment_method` | `varchar` | No | - | Payment method label/code. |
| `order_state` | `varchar` | No | - | Order state. |
| `created_at` | `timestamptz` | No | `now()` | Created timestamp. |
| `updated_at` | `timestamptz` | No | `now()` | Updated timestamp. |

Primary key: `seq`  
Unique key: `order_no`

Current row count: 0

Note: `order` is a reserved-ish SQL keyword and must be quoted as `public."order"` in raw SQL.

### `public.order_goods`

Ordered product line-item table.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `seq` | `int4` | No | `nextval('order_goods_seq_seq')` | Primary key. Line-item row ID. |
| `order_no` | `varchar` | No | - | Likely references `order.order_no`. |
| `goods_no` | `int4` | No | - | Likely references `goods.goods_no`. |
| `goods_options` | `varchar` | No | - | Serialized selected options. |
| `order_state` | `varchar` | Yes | `'ORDERED'` | Line item state. |
| `created_at` | `timestamptz` | Yes | `now()` | Created timestamp. |
| `updated_at` | `timestamptz` | Yes | `now()` | Updated timestamp. |

Primary key: `seq`

Current row count: 0

Important: `goods_options` appears to store option selections as text. Because no rows exist yet, its actual serialization format could not be verified.

## Existing Constraints

| Table | Constraint | Type | Definition |
| --- | --- | --- | --- |
| `goods` | `goods_pkey` | PK | `PRIMARY KEY (goods_no)` |
| `goods_cate` | `goodsCate_pkey` | PK | `PRIMARY KEY (cate_cd)` |
| `options` | `options_pkey` | PK | `PRIMARY KEY (opt_no)` |
| `options_group` | `optionsgroup_pkey` | PK | `PRIMARY KEY (seq)` |
| `order` | `order_pkey` | PK | `PRIMARY KEY (seq)` |
| `order` | `order_orderNo_key` | Unique | `UNIQUE (order_no)` |
| `order_goods` | `order_goods_pkey` | PK | `PRIMARY KEY (seq)` |

No foreign key constraints are currently defined.

## Data Integrity Checks

| Check | Result |
| --- | ---: |
| `goods.cate_cd` not found in `goods_cate.cate_cd` | 0 |
| `options_group.goods_no` not found in `goods.goods_no` | 0 |
| `options_group.opt_no` not found in `options.opt_no` | 0 |
| `order_goods.goods_no` not found in `goods.goods_no` | 0 |
| `order_goods.order_no` not found in `order.order_no` | 0 |
| Duplicate `options_group(goods_no, opt_no)` pairs | 5 |

The current product/category/option mapping data is mostly consistent, but duplicate product-option mapping rows should be cleaned up before adding a unique constraint.

