# Supabase Usage Rules

Project: `paiks_coffee`  
Analysis date: 2026-05-14

## Current Risks

### RLS is disabled on most public tables

Supabase reports RLS disabled for:

- `public.goods`
- `public.goods_cate`
- `public.options`
- `public.options_group`
- `public.order_goods`

Only `public.order` currently has RLS enabled.

Impact:

- If these tables are accessed directly from the browser with the anon key, users may be able to read or modify data depending on granted privileges.
- Product catalog tables may be intentionally public-read, but writes should not be public.
- Order line items are sensitive and should not be exposed without strict policies.

Do not blindly enable RLS without policies. Enabling RLS without policies can block expected app access.

Recommended later:

```sql
alter table public.goods enable row level security;
alter table public.goods_cate enable row level security;
alter table public.options enable row level security;
alter table public.options_group enable row level security;
alter table public.order_goods enable row level security;
```

Then add explicit policies by access pattern.

## Next.js Query Rules

### Prefer server-side reads for composed product detail data

Because foreign keys are not currently defined, Supabase nested selects like this may not work:

```ts
.select("*, options_group(*, options(*))")
```

Until FKs exist, use explicit queries:

1. Query `goods`.
2. Query `options_group`.
3. Query `options`.
4. Join in the server layer.

Good place:

- Next.js Server Components
- Route Handlers
- Server Actions for writes

Avoid putting order creation logic only in Client Components.

### Convert `y`/`n` flags at the boundary

Database flags are string values, not booleans.

Recommended conversion:

```ts
const toBool = (value: string | null | undefined) => value === "y";
```

Apply this consistently for:

- `ice_fl`
- `best_fl`
- `new_fl`
- `soldout_fl`
- `del_fl`

When writing back, convert booleans to `"y"` or `"n"` explicitly.

### Quote `order` in raw SQL

The table name `order` must be quoted in raw SQL:

```sql
select * from public."order";
```

Supabase client calls can use:

```ts
supabase.from("order")
```

But raw SQL, RPC functions, and migrations must quote it.

### Use `order_no` carefully

`order.order_no` is unique and appears to be the business order ID. `order_goods.order_no` likely references it.

Rules:

- Generate `order_no` server-side.
- Treat `order_no` as immutable after creation.
- Do not rely on client-generated order numbers unless collision handling exists.

### Do not trust client-calculated prices

Product and option prices live in the database:

- `goods.goods_price`
- `options.opt_price`

Order totals should be calculated or validated server-side. Client-side totals are only display hints.

Recommended write validation:

1. Receive selected `goods_no` and selected `opt_no` values.
2. Fetch product from `goods`.
3. Fetch allowed options via `options_group`.
4. Reject any selected option not mapped to the product.
5. Reject sold-out product/options.
6. Calculate total from DB prices.
7. Insert `order`.
8. Insert `order_goods`.

## Product List Query Structure

### Categories

```ts
const { data: categories } = await supabase
  .from("goods_cate")
  .select("cate_cd, cate_nm")
  .order("cate_cd");
```

### Products

```ts
const { data: products } = await supabase
  .from("goods")
  .select("goods_no, cate_cd, goods_nm, goods_en_nm, goods_price, ice_fl, best_fl, new_fl, soldout_fl")
  .eq("del_fl", "n")
  .order("goods_no");
```

For category-filtered screens:

```ts
const { data: products } = await supabase
  .from("goods")
  .select("goods_no, cate_cd, goods_nm, goods_en_nm, goods_price, ice_fl, best_fl, new_fl, soldout_fl")
  .eq("cate_cd", cateCd)
  .eq("del_fl", "n")
  .order("goods_no");
```

## Product Detail Query Structure

Until FKs are added, use explicit joins in application code.

```ts
const { data: product } = await supabase
  .from("goods")
  .select("*")
  .eq("goods_no", goodsNo)
  .eq("del_fl", "n")
  .single();

const { data: mappings } = await supabase
  .from("options_group")
  .select("opt_no")
  .eq("goods_no", goodsNo);

const optNos = [...new Set((mappings ?? []).map((row) => row.opt_no))];

const { data: options } = await supabase
  .from("options")
  .select("opt_no, opt_nm, opt_en_nm, opt_type, opt_price, opt_max_cnt, soldout_fl")
  .in("opt_no", optNos)
  .order("opt_type")
  .order("opt_no");
```

Important:

- Use `Set` or SQL deduplication because `options_group` currently has duplicate mappings.
- Group options by `opt_type` in the server layer or UI layer.

## Order Write Rules

Current tables support:

```text
order
order_goods
```

Suggested order creation transaction:

1. Validate cart items against `goods`.
2. Validate selected options against `options_group`.
3. Fetch current prices from `goods` and `options`.
4. Calculate total server-side.
5. Insert into `order`.
6. Insert line items into `order_goods`.

Because Supabase client inserts are not automatically transactional across multiple calls, prefer one of:

- Postgres RPC function
- Next.js Route Handler using a server-side connection and transaction
- Edge Function with service role access and strict validation

## Future Schema Improvements

### Add foreign keys

Recommended after cleanup:

- `goods.cate_cd` -> `goods_cate.cate_cd`
- `options_group.goods_no` -> `goods.goods_no`
- `options_group.opt_no` -> `options.opt_no`
- `order_goods.order_no` -> `order.order_no`
- `order_goods.goods_no` -> `goods.goods_no`

### Deduplicate and constrain product-option mappings

Current duplicate count: 5 `(goods_no, opt_no)` pairs.

After cleanup, add:

```sql
alter table public.options_group
  add constraint options_group_goods_opt_unique
  unique (goods_no, opt_no);
```

### Normalize selected order options

Current column:

```text
order_goods.goods_options varchar
```

Recommended later:

```text
order_goods_options
  seq
  order_goods_seq
  opt_no
  opt_nm_snapshot
  opt_price_snapshot
  quantity
```

This makes order detail display, validation, refunds, and analytics more reliable.

### Add display ordering

Current product/category ordering appears to rely on code values and `goods_no`.

Consider adding later:

- `goods_cate.sort_order`
- `goods.sort_order`
- `options.sort_order`

### Add price/name snapshots for orders

For stable historical orders, `order_goods` should eventually store:

- Product name snapshot
- Product unit price snapshot
- Selected option name snapshots
- Selected option price snapshots

Without snapshots, historical order display can change if product or option master data changes.

