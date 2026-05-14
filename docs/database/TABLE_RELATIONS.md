# Table Relations

Project: `paiks_coffee`  
Analysis date: 2026-05-14

## Summary

Foreign keys are not defined in the database, but the naming and data patterns strongly indicate the following relationships:

```text
goods_cate 1 ── N goods
goods      N ── M options
goods      1 ── N order_goods
order      1 ── N order_goods
```

The `goods` to `options` many-to-many relationship is implemented through `options_group`.

## Inferred Relationships

### `goods_cate` -> `goods`

Inferred relationship:

```text
goods_cate.cate_cd = goods.cate_cd
```

Cardinality:

```text
goods_cate 1:N goods
```

Evidence:

- `goods_cate.cate_cd` is the primary key.
- `goods.cate_cd` repeats across products.
- Every `goods.cate_cd` currently exists in `goods_cate`.
- Product counts per category range from 3 to 44.

Frontend meaning:

- Category tabs or filters should come from `goods_cate`.
- Product lists should filter `goods` by `cate_cd`.

### `goods` -> `options_group`

Inferred relationship:

```text
goods.goods_no = options_group.goods_no
```

Cardinality:

```text
goods 1:N options_group
```

Evidence:

- `goods.goods_no` is the product primary key.
- `options_group.goods_no` repeats across multiple option rows.
- No orphaned `options_group.goods_no` values were found.

Frontend meaning:

- Product detail pages should fetch option mappings for the selected `goods_no`.
- Product list pages probably should not fetch full options unless displaying option badges or enabling direct order from the list.

### `options` -> `options_group`

Inferred relationship:

```text
options.opt_no = options_group.opt_no
```

Cardinality:

```text
options 1:N options_group
```

Evidence:

- `options.opt_no` is the option primary key.
- `options_group.opt_no` repeats across multiple products.
- No orphaned `options_group.opt_no` values were found.

Combined relationship:

```text
goods N:M options through options_group
```

Current risk:

- `options_group` contains 5 duplicate `(goods_no, opt_no)` pairs.
- A future unique constraint on `(goods_no, opt_no)` should only be added after deduplication.

### `order` -> `order_goods`

Inferred relationship:

```text
order.order_no = order_goods.order_no
```

Cardinality:

```text
order 1:N order_goods
```

Evidence:

- `order.order_no` has a unique constraint.
- `order_goods.order_no` is named like a reference to that business key.
- Both tables are currently empty, so this relationship is inferred from structure rather than sample data.

Design note:

- `order_goods` references `order_no`, not `order.seq`.
- This is valid if `order_no` is the stable business key, but it must remain unique and immutable.

### `goods` -> `order_goods`

Inferred relationship:

```text
goods.goods_no = order_goods.goods_no
```

Cardinality:

```text
goods 1:N order_goods
```

Evidence:

- `goods.goods_no` is the product primary key.
- `order_goods.goods_no` stores the ordered product ID.
- `order_goods` is currently empty, so this is inferred from structure.

Important order-history concern:

- `order_goods` stores `goods_no`, but not `goods_nm` or unit price snapshots.
- If product names or prices change later, old orders may display current product data unless snapshots are added or handled elsewhere.

## Product / Option / Category Data Flow

### Product List

Recommended read shape:

```text
goods_cate
  -> goods filtered by cate_cd, del_fl = 'n', soldout_fl as needed
```

Typical UI flow:

1. Load categories from `goods_cate`.
2. Load products from `goods`.
3. Filter by active `cate_cd`.
4. Sort by a stable rule. No explicit sort column currently exists, so use `goods_no` unless a display order column is added later.

Fields likely needed:

- `goods.goods_no`
- `goods.cate_cd`
- `goods.goods_nm`
- `goods.goods_en_nm`
- `goods.goods_price`
- `goods.ice_fl`
- `goods.best_fl`
- `goods.new_fl`
- `goods.soldout_fl`

### Product Detail

Recommended read shape:

```text
goods by goods_no
options_group by goods_no
options by opt_no
```

Desired nested result once FKs exist:

```text
goods
  options_group
    options
```

Until FKs exist, the frontend or server layer should perform explicit queries:

1. Fetch product by `goods_no`.
2. Fetch mappings from `options_group` where `goods_no = selected goods_no`.
3. Fetch options where `opt_no` is in the mapping list.
4. Group options by `opt_type`.
5. Apply `soldout_fl`, `opt_max_cnt`, and price rules in the UI/order validation layer.

### Option Selection

Option data flow:

```text
options_group determines which options are available for a product.
options defines option display name, price, type, sold-out status, and max count.
```

Important interpretation:

- `opt_type` is a display/behavior grouping field, not a normalized lookup table.
- `opt_max_cnt` controls per-option count, but there is no table-level rule for per-type maximums.

### Order Creation

Current likely write flow:

```text
order
  -> order_goods
```

Potential issue:

- `order_goods.goods_options` is a `varchar`, likely storing serialized selected options.
- This blocks relational validation and reporting on option selections.

More normalized future shape:

```text
order
  -> order_goods
    -> order_goods_options
```

Where `order_goods_options` would store:

- `order_goods_seq`
- `opt_no`
- `opt_nm_snapshot`
- `opt_price_snapshot`
- `quantity`

## N:M Relationship Candidates

Confirmed by structure and data:

- `goods` N:M `options` through `options_group`

Possible future N:M:

- `order_goods` N:M `options` through a future selected-options table

Not currently represented:

- Product images
- Store/branch availability
- Category display ordering
- Option type master table

## Normalization Findings

### Duplicate product-option mappings

`options_group` has duplicate `(goods_no, opt_no)` pairs. This can cause:

- Duplicate options in product detail UI
- Incorrect option count
- Double-charged option calculations if client code does not dedupe

Recommended later:

1. Deduplicate existing rows.
2. Add a unique constraint on `(goods_no, opt_no)`.

### HOT/ICED modeled as separate products

HOT and ICED variants are represented as separate `goods` rows.

This is workable, but the frontend should not assume one logical drink has one row. If a UI needs to group HOT/ICED variants, it will need name-based grouping or a future `base_goods_no` / `variant_type` model.

### Flags stored as text

Flags such as `ice_fl`, `best_fl`, `new_fl`, `soldout_fl`, and `del_fl` are stored as `varchar`/`bpchar` with `y`/`n` values.

This is common in migrated schemas, but Next.js code should convert these to booleans at the data boundary.

### `goods_options` serialized text

Selected order options are likely stored as serialized text in `order_goods.goods_options`.

This is risky for:

- Price recalculation
- Analytics
- Order display consistency
- Validating whether selected options were allowed for the product
- Reporting sold option quantities

## Future Foreign Key Recommendations

Only add these after duplicate and orphan checks are clean in production data.

```sql
alter table public.goods
  add constraint goods_cate_cd_fkey
  foreign key (cate_cd)
  references public.goods_cate(cate_cd);

alter table public.options_group
  add constraint options_group_goods_no_fkey
  foreign key (goods_no)
  references public.goods(goods_no);

alter table public.options_group
  add constraint options_group_opt_no_fkey
  foreign key (opt_no)
  references public.options(opt_no);

alter table public.order_goods
  add constraint order_goods_order_no_fkey
  foreign key (order_no)
  references public."order"(order_no);

alter table public.order_goods
  add constraint order_goods_goods_no_fkey
  foreign key (goods_no)
  references public.goods(goods_no);
```

After cleaning duplicates:

```sql
alter table public.options_group
  add constraint options_group_goods_opt_unique
  unique (goods_no, opt_no);
```

