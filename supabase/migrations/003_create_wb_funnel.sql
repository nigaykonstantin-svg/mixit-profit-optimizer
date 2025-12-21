-- Create wb_funnel table for storing imported funnel data
create table if not exists wb_funnel (
  id uuid default gen_random_uuid() primary key,

  sku text,
  name text,
  brand text,

  views numeric,
  clicks numeric,
  cart numeric,
  orders numeric,

  ctr numeric,
  cr numeric,
  cr_cart numeric,
  cr_order numeric,

  avg_price numeric,
  revenue numeric,

  stock_units numeric,

  drr_search numeric,
  drr_media numeric,
  drr_bloggers numeric,
  drr_other numeric,

  created_at timestamptz default now()
);

create index if not exists wb_funnel_sku_idx on wb_funnel (sku);

-- Enable RLS
alter table wb_funnel enable row level security;

-- Allow all operations for now
create policy "Allow all operations on wb_funnel"
  on wb_funnel
  for all
  using (true)
  with check (true);
