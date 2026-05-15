# Order Seed SQL Draft

Purpose: `/admin/orders` and `/admin/orders/[orderNo]` read-only UI testing.

Do not run this blindly in production. This is an INSERT draft only.

## Confirmed Current Columns

Checked against Supabase project `pgakjfcmjemrcdrcjpdy`.

### `public."order"`

Raw SQL must quote the table name because `order` is SQL syntax.

| Column | Type | Notes |
| --- | --- | --- |
| `seq` | `int4` | Primary key, default sequence |
| `order_no` | `varchar(10)` | Unique business order number |
| `total_price` | `int4` | Nullable order total |
| `payment_method` | `varchar(10)` | Payment method |
| `order_state` | `varchar(10)` | DB status column; app maps this to `order_status` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `public.order_goods`

| Column | Type | Notes |
| --- | --- | --- |
| `seq` | `int4` | Primary key, default sequence |
| `order_no` | `varchar(10)` | Connects to `order.order_no` |
| `goods_no` | `int4` | Ordered product ID |
| `goods_options` | `varchar(20)` | Serialized/text option selections |
| `order_state` | `varchar(10)` | Nullable item status, default `'ORDERED'` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

## Execution Notes

- This draft creates 4 test orders and 8 order item rows.
- Status samples include `pending`, `cooking`, `completed`, and `canceled`.
- `order_state` values are lowercase to match the admin app's current `order_status` mapping.
- `order_goods.goods_options` stores option details as text because the current table has no normalized selected-option rows.
- Keep `order_no`, `payment_method`, `order_state`, and `goods_options` within the current varchar length limits.
- `order_goods` has no quantity, item price, or product name snapshot columns. The current detail UI treats each `order_goods` row as quantity `1` and displays current `goods.goods_price` as a reference.
- Confirm the `goods_no` values below exist in `public.goods` before running, or the detail page will show missing product rows.
- If RLS blocks inserts through the Data API, run this from the Supabase SQL editor or another privileged database connection.
- The SQL intentionally omits `seq` so the database sequences assign primary keys.

Optional pre-check:

```sql
select goods_no, goods_nm, goods_price
from public.goods
where goods_no in (
  1000000001,
  1000000002,
  1000000003,
  1000000005,
  1000000012,
  1000000023,
  1000000124,
  1000000148
)
order by goods_no;
```

## INSERT SQL Draft

```sql
begin;

insert into public."order" (
  order_no,
  total_price,
  payment_method,
  order_state,
  created_at,
  updated_at
) values
  (
    'ORD2505001',
    3500,
    'card',
    'pending',
    now() - interval '12 minutes',
    now() - interval '12 minutes'
  ),
  (
    'ORD2505002',
    9500,
    'kakao',
    'cooking',
    now() - interval '35 minutes',
    now() - interval '18 minutes'
  ),
  (
    'ORD2505003',
    8000,
    'naver',
    'completed',
    now() - interval '2 hours',
    now() - interval '95 minutes'
  ),
  (
    'ORD2505004',
    6300,
    'credit',
    'canceled',
    now() - interval '1 day',
    now() - interval '23 hours'
  );

insert into public.order_goods (
  order_no,
  goods_no,
  goods_options,
  order_state,
  created_at,
  updated_at
) values
  (
    'ORD2505001',
    1000000002,
    '샷+1,매장컵',
    'pending',
    now() - interval '12 minutes',
    now() - interval '12 minutes'
  ),
  (
    'ORD2505001',
    1000000001,
    '옵션없음',
    'pending',
    now() - interval '12 minutes',
    now() - interval '12 minutes'
  ),
  (
    'ORD2505002',
    1000000003,
    '샷+1,얼음기본',
    'cooking',
    now() - interval '35 minutes',
    now() - interval '18 minutes'
  ),
  (
    'ORD2505002',
    1000000012,
    '휘핑+,당도기본',
    'cooking',
    now() - interval '35 minutes',
    now() - interval '18 minutes'
  ),
  (
    'ORD2505002',
    1000000148,
    '데우기요청',
    'cooking',
    now() - interval '35 minutes',
    now() - interval '18 minutes'
  ),
  (
    'ORD2505003',
    1000000005,
    '샷+2,개인컵',
    'completed',
    now() - interval '2 hours',
    now() - interval '95 minutes'
  ),
  (
    'ORD2505003',
    1000000124,
    '얼음많이,덜달게',
    'completed',
    now() - interval '2 hours',
    now() - interval '95 minutes'
  ),
  (
    'ORD2505004',
    1000000023,
    '샷+1,얼음기본',
    'canceled',
    now() - interval '1 day',
    now() - interval '23 hours'
  );

commit;
```

## Post-insert Check

```sql
select
  o.order_no,
  o.order_state,
  o.payment_method,
  o.total_price,
  o.created_at,
  count(og.seq) as item_count
from public."order" o
left join public.order_goods og
  on og.order_no = o.order_no
where o.order_no like 'ORD250500%'
group by
  o.order_no,
  o.order_state,
  o.payment_method,
  o.total_price,
  o.created_at
order by o.created_at desc;
```

## Rollback DELETE SQL

Delete child rows first, then parent rows.

```sql
begin;

delete from public.order_goods
where order_no in (
  'ORD2505001',
  'ORD2505002',
  'ORD2505003',
  'ORD2505004'
);

delete from public."order"
where order_no in (
  'ORD2505001',
  'ORD2505002',
  'ORD2505003',
  'ORD2505004'
);

commit;
```
