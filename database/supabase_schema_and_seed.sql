-- ============================================================================
-- MOLLY'S KITCHEN (MIGSUN TWIINZ, ETA 2) — SUPABASE POSTGRESQL SCHEMA & SEED
-- ============================================================================

-- 1. Residents Table (Scoped to Migsun Twiinz SUN 1 to SUN 10)
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tower TEXT NOT NULL CHECK (tower IN (
    'SUN 1','SUN 2','SUN 3','SUN 4','SUN 5',
    'SUN 6','SUN 7','SUN 8','SUN 9','SUN 10'
  )),
  flat TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Rotational Daily Dinner Thalis Table (@ ₹139)
CREATE TABLE IF NOT EXISTS daily_rotational_thalis (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  base_template TEXT NOT NULL,
  rotating_sabzi TEXT,
  price_inr INT NOT NULL DEFAULT 139,
  is_veg BOOLEAN DEFAULT true,
  active_tonight BOOLEAN DEFAULT true,
  total_portions INT NOT NULL DEFAULT 40,
  remaining_portions INT NOT NULL DEFAULT 40,
  rotis_per_meal INT NOT NULL DEFAULT 0,
  puris_per_meal INT NOT NULL DEFAULT 0,
  badge TEXT,
  image_url TEXT,
  cutoff_label TEXT DEFAULT '8:45 PM',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Fixed Fast-Food Menu Catalog Table (29 Items)
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_inr INT NOT NULL,
  is_veg BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  bestseller BOOLEAN DEFAULT false,
  prep_time TEXT DEFAULT '10 mins',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Orders Table (Sequential Tokens #MK-101+, Razorpay + COD, Free Delivery)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  resident_phone VARCHAR(15) NOT NULL,
  tower TEXT NOT NULL,
  flat TEXT NOT NULL,
  delivery_slot TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Razorpay Online', 'Cash on Delivery')),
  payment_status TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  total_inr INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Order Accepted' CHECK (status IN (
    'Order Accepted',
    'Cooking in Kitchen',
    'Out for Delivery',
    'Delivered'
  )),
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SEED DATA: 2 ROTATIONAL THALIS (@ ₹139)
-- ============================================================================
INSERT INTO daily_rotational_thalis (
  id, title, base_template, rotating_sabzi, price_inr, is_veg, active_tonight,
  total_portions, remaining_portions, rotis_per_meal, puris_per_meal, badge, image_url
) VALUES
(
  'thali-roti-sabzi',
  'Homestyle Sabzi + 4 Roti + Dal Fry + Rice Thali',
  '4 Butter Tawa Roti + Homestyle Dal Fry + Steamed Basmati Rice + Fresh Garden Salad',
  'Aloo Gobhi Adraki Masala',
  139, true, true, 40, 18, 4, 0,
  'Tonight''s Rotating Sabzi Meal',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80'
),
(
  'thali-puri-chole',
  'Punjabi Chole + Rice + 5 Hot Puri + Salad Meal',
  'Amritsari Pindi Chole + Steamed Basmati Rice + 5 Hot Fluffy Puris + Pickled Onion Salad',
  NULL,
  139, true, true, 35, 14, 0, 5,
  'Daily Dinner Special',
  'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=900&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: ALL 29 FIXED MENU ITEMS FROM MOLLY'S KITCHEN PAMPHLET
-- ============================================================================
INSERT INTO menu_items (id, name, category, price_inr, is_veg, in_stock, bestseller, prep_time, description) VALUES
('mk-combo-1', 'Aaloo Patty Burger + Salted Fries + Coke', 'Meal For 1', 149, true, true, true, '12 mins', 'Perfect for One! Crispy Aaloo Patty Burger served with Salted Potato Fries and Coke.'),
('mk-burg-1', 'Aaloo Patty Burger', 'Burgers', 69, true, true, true, '10 mins', 'Crispy spiced potato patty in a toasted bun with fresh veggies and creamy dressing.'),
('mk-burg-2', 'Aaloo Patty Cheese Burger', 'Burgers', 79, true, true, true, '10 mins', 'Golden herb-crusted Aaloo patty layered with a rich melted cheese slice.'),
('mk-burg-3', 'Aaloo Patty Nacho & Cheese Burger', 'Burgers', 89, true, true, true, '12 mins', 'Loaded burger stacked with crunchy nachos, melted cheese slice, and crispy Aaloo patty.'),
('mk-burg-4', 'Extra Cheese', 'Burgers', 19, true, true, false, '2 mins', 'Extra rich cheese slice add-on.'),
('mk-mag-1', 'Plain Maggie', 'Noodles & Maggie', 49, true, true, false, '8 mins', 'Classic homestyle masala Maggie cooked piping hot.'),
('mk-mag-2', 'Vegetables Maggie', 'Noodles & Maggie', 59, true, true, true, '10 mins', 'Masala Maggie simmered with carrots, capsicum, green peas, and onions.'),
('mk-mag-3', 'Plain Amul Butter Maggie', 'Noodles & Maggie', 69, true, true, false, '8 mins', 'Hot classic masala Maggie finished with creamy Amul butter.'),
('mk-mag-4', 'Vegetables Butter Maggie', 'Noodles & Maggie', 79, true, true, true, '10 mins', 'Fresh seasonal veggies sautéed in rich Amul butter with masala Maggie.'),
('mk-mag-5', 'Plain Cheese Maggie', 'Noodles & Maggie', 79, true, true, false, '10 mins', 'Velvety masala Maggie infused and topped with melted cheese.'),
('mk-mag-6', 'Butter & Cheese Vegetable Maggie', 'Noodles & Maggie', 99, true, true, true, '12 mins', 'Ultimate loaded Maggie with garden veggies, Amul butter, and molten cheese.'),
('mk-pas-1', 'Macroni Homestyle', 'Pasta', 129, true, true, true, '14 mins', 'Desi homestyle masala macaroni tossed with tangy tomatoes, onions, and capsicum.'),
('mk-pas-2', 'Creamy Arrabiata Pasta', 'Pasta', 149, true, true, false, '15 mins', 'Penne pasta in zesty red tomato arrabiata sauce blended with fresh cream.'),
('mk-pas-3', 'Fettuccine Alfredo Pasta', 'Pasta', 159, true, true, true, '15 mins', 'Rich velvety white cheese Alfredo sauce with garlic, oregano, and fettuccine.'),
('mk-pas-4', 'Alfredo Spaghetti', 'Pasta', 179, true, true, false, '15 mins', 'Classic spaghetti pasta coated in creamy, cheesy garlic Alfredo sauce.'),
('mk-pas-5', 'Mac And Cheese', 'Pasta', 159, true, true, true, '15 mins', 'Indulgent elbow macaroni simmered in thick, creamy double-cheese sauce.'),
('mk-fri-1', 'Peri-Peri Fries', 'Fries & Crisps', 89, true, true, true, '8 mins', 'Golden potato fries tossed in tangy, spicy peri-peri seasoning.'),
('mk-fri-2', 'Salted Potato Fries', 'Fries & Crisps', 89, true, true, false, '8 mins', 'Classic crunchy golden french fries lightly seasoned with salt.'),
('mk-fri-3', 'Peri-Peri Cheesy Potato Fries', 'Fries & Crisps', 109, true, true, true, '10 mins', 'Loaded peri-peri french fries drizzled generously with warm liquid cheese.'),
('mk-egg-1', '1 Egg Amul Butter Omelette', 'Eggs & Omelettes', 39, false, true, false, '7 mins', 'Single-egg masala omelette whisked with onions, chillies, and coriander in Amul butter.'),
('mk-egg-2', '2 Eggs Amul Butter Omelette', 'Eggs & Omelettes', 49, false, true, true, '8 mins', 'Fluffy 2-egg masala omelette pan-fried in rich Amul butter.'),
('mk-egg-3', '2 Eggs Bread Butter Omelette', 'Eggs & Omelettes', 69, false, true, true, '10 mins', 'Hearty 2-egg Amul butter masala omelette served with toasted butter bread slices.'),
('mk-egg-4', 'Egg Bhurji (2 Eggs)', 'Eggs & Omelettes', 79, false, true, true, '10 mins', 'Homestyle spiced scrambled eggs sautéed with onions, tomatoes, green chillies, and Amul butter.'),
('mk-brd-1', 'Spiced Potato Toastie (4 pieces)', 'The Bread Basket', 59, true, true, false, '10 mins', 'Crispy grilled sandwich stuffed with spiced potato mash (4 pieces).'),
('mk-brd-2', 'Potato Cheese Toast (4 pieces)', 'The Bread Basket', 79, true, true, true, '10 mins', 'Golden butter-toasted sandwich filled with spiced aloo masala and melted cheese (4 pieces).'),
('mk-brd-3', 'Vegetable Cheese Toastie (4 pieces)', 'The Bread Basket', 99, true, true, true, '12 mins', 'Loaded crunch of sweet corn, capsicum, onions, and molten cheese in 4 grilled pieces.'),
('mk-ext-1', 'Coke', 'Extras', 20, true, true, true, 'Instant', 'Chilled Coca-Cola beverage.'),
('mk-ext-2', 'Fanta', 'Extras', 20, true, true, false, 'Instant', 'Chilled tangy orange Fanta beverage.'),
('mk-ext-3', 'Thums Up', 'Extras', 20, true, true, true, 'Instant', 'Chilled strong fizzy Thums Up cola.')
ON CONFLICT (id) DO NOTHING;
