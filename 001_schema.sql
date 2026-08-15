-- RAYAN — схема базы данных (Postgres / Supabase)

create extension if not exists "uuid-ossp";

-- Пользователи (агенты/админ/руководитель)
create table users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null unique,
  role text not null check (role in ('руководитель','администратор','агент')),
  created_at timestamptz default now()
);

-- Объекты (общая таблица для всех 5 типов)
create table listings (
  id uuid primary key default uuid_generate_v4(),
  display_id text unique, -- RAYAN-000001, генерируется триггером
  type text not null check (type in ('первичка','вторичка','дом','участок','коммерция')),
  status text not null default 'на проверке'
    check (status in ('активен','на проверке','забронирован','сделка в процессе','продан','снят с продажи','архив')),

  price numeric,
  currency text default '$',
  district text,
  address text,
  rooms text,
  area_m2 numeric,
  plot_sotka numeric,
  floor int,
  floors_total int,
  renovation text,
  zhk text,
  sk text,
  documents text[],

  description text,       -- для клиента
  full_brief text,         -- остальные детальные пункты брифа текстом

  map_link text,
  video_link text,

  agent_id uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  last_checked_at timestamptz,
  last_checked_by uuid references users(id)
);

-- Автогенерация display_id
create sequence listing_seq start 1;
create or replace function set_display_id() returns trigger as $$
begin
  new.display_id := 'RAYAN-' || lpad(nextval('listing_seq')::text, 6, '0');
  return new;
end;
$$ language plpgsql;
create trigger trg_display_id before insert on listings
  for each row execute function set_display_id();

-- Фото (порядок задаётся полем position)
create table listing_photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  url text not null,
  position int default 0,
  category text default 'фото' -- фото/техпаспорт/красная книга/генплан/др.
);

-- Контакты — ОТДЕЛЬНАЯ таблица, видна только руководителю/админу
create table listing_contacts (
  listing_id uuid primary key references listings(id) on delete cascade,
  source_type text check (source_type in ('собственник','агент','договорник','застройщик','партнёр','другое')),
  owner_name text,
  owner_phone text,
  agent_contact_name text,
  agent_contact_phone text,
  commission text,
  commission_payer text,
  deal_terms text
);

-- История изменений
create table listing_history (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  changed_by uuid references users(id),
  changed_at timestamptz default now(),
  field text,
  old_value text,
  new_value text
);

-- Права: строка видна всем агентам, но listing_contacts — только руководителю/админу.
-- Это делается через Row Level Security (RLS) в Supabase, настроим на этапе подключения.
