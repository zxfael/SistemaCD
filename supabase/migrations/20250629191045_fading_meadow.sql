/*
  # Complete Digital Menu System Setup

  1. New Tables
    - `profiles` - User profiles with roles
    - `restaurants` - Restaurant information
    - `categories` - Menu categories
    - `menu_items` - Menu items with full details
    - `menu_item_variants` - Item variations (size, extras)
    - `orders` - Customer orders
    - `order_items` - Items within orders
    - `coupons` - Discount coupons
    - `theme_settings` - Restaurant theme customization
    - `analytics` - Daily analytics data
    - `notifications` - System notifications
    - `reviews` - Customer reviews

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for all operations
    - Secure admin and user access patterns

  3. Sample Data
    - Default admin user
    - Sample restaurant
    - Sample menu items
    - Default theme settings
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_item_variants CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS theme_settings CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'customer');
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'online');
CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  status TEXT DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address JSONB,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "22:00", "closed": false}, "tuesday": {"open": "08:00", "close": "22:00", "closed": false}, "wednesday": {"open": "08:00", "close": "22:00", "closed": false}, "thursday": {"open": "08:00", "close": "22:00", "closed": false}, "friday": {"open": "08:00", "close": "22:00", "closed": false}, "saturday": {"open": "08:00", "close": "22:00", "closed": false}, "sunday": {"open": "08:00", "close": "22:00", "closed": false}}'::jsonb,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  delivery_radius INTEGER DEFAULT 10,
  status restaurant_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  promotional_price DECIMAL(10,2),
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  ingredients JSONB DEFAULT '[]'::jsonb,
  allergens JSONB DEFAULT '[]'::jsonb,
  nutritional_info JSONB DEFAULT '{}'::jsonb,
  preparation_time INTEGER DEFAULT 0,
  calories INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu item variants table
CREATE TABLE menu_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_required BOOLEAN DEFAULT FALSE,
  max_selections INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type delivery_type NOT NULL DEFAULT 'delivery',
  delivery_address JSONB,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  order_status order_status DEFAULT 'pending',
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  variants JSONB DEFAULT '{}'::jsonb,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theme settings table
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#1E1E1E',
  secondary_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#FFD700',
  background_color TEXT DEFAULT '#1E1E1E',
  text_color TEXT DEFAULT '#FFFFFF',
  font_family TEXT DEFAULT 'Inter',
  logo_url TEXT,
  favicon_url TEXT,
  background_image TEXT,
  custom_css TEXT,
  layout_style TEXT DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  most_popular_item TEXT,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for restaurants
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can manage their restaurants"
  ON restaurants FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all restaurants"
  ON restaurants FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = categories.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all categories"
  ON categories FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for menu_items
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Restaurant owners can manage their menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = menu_items.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all menu items"
  ON menu_items FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for menu_item_variants
CREATE POLICY "Anyone can view menu item variants"
  ON menu_item_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM menu_items 
      WHERE id = menu_item_variants.menu_item_id 
      AND is_available = true
    )
  );

CREATE POLICY "Restaurant owners can manage their menu item variants"
  ON menu_item_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM menu_items mi
      JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_variants.menu_item_id 
      AND r.owner_id = auth.uid()
    )
  );

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Restaurant owners can view their restaurant orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = orders.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Restaurant owners can update their restaurant orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = orders.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for order_items
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_items.order_id 
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can view their restaurant order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_items.order_id 
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_items.order_id 
      AND (customer_id = auth.uid() OR customer_id IS NULL)
    )
  );

-- Policies for theme_settings
CREATE POLICY "Anyone can view theme settings"
  ON theme_settings FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their theme settings"
  ON theme_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = theme_settings.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all theme settings"
  ON theme_settings FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for analytics
CREATE POLICY "Restaurant owners can view their analytics"
  ON analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = analytics.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON analytics FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Restaurant owners can manage reviews for their restaurant"
  ON reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = reviews.restaurant_id 
      AND owner_id = auth.uid()
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON theme_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
DO $$
DECLARE
  admin_id UUID;
  restaurant_id UUID;
  category_principais_id UUID;
  category_petiscos_id UUID;
  category_sobremesas_id UUID;
  category_lanches_id UUID;
BEGIN
  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@sabordigital.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  )
  RETURNING id INTO admin_id;

  -- Create admin profile
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    admin_id,
    'admin@sabordigital.com',
    'Administrador',
    'admin'
  );

  -- Create sample restaurant
  INSERT INTO restaurants (
    id,
    owner_id,
    name,
    slug,
    description,
    phone,
    email,
    delivery_fee,
    minimum_order
  )
  VALUES (
    gen_random_uuid(),
    admin_id,
    'Sabor Digital',
    'sabor-digital',
    'Restaurante de comida nordestina tradicional com cardápio digital moderno.',
    '(83) 98614-7817',
    'contato@sabordigital.com',
    10.00,
    25.00
  )
  RETURNING id INTO restaurant_id;

  -- Create categories
  INSERT INTO categories (id, restaurant_id, name, description, sort_order)
  VALUES 
    (gen_random_uuid(), restaurant_id, 'Pratos Principais', 'Pratos tradicionais nordestinos', 1),
    (gen_random_uuid(), restaurant_id, 'Petiscos', 'Aperitivos e petiscos regionais', 2),
    (gen_random_uuid(), restaurant_id, 'Sobremesas', 'Doces típicos da região', 3),
    (gen_random_uuid(), restaurant_id, 'Lanches', 'Lanches rápidos e tapiocas', 4)
  RETURNING id INTO category_principais_id;

  -- Get category IDs
  SELECT id INTO category_principais_id FROM categories WHERE restaurant_id = restaurant_id AND name = 'Pratos Principais';
  SELECT id INTO category_petiscos_id FROM categories WHERE restaurant_id = restaurant_id AND name = 'Petiscos';
  SELECT id INTO category_sobremesas_id FROM categories WHERE restaurant_id = restaurant_id AND name = 'Sobremesas';
  SELECT id INTO category_lanches_id FROM categories WHERE restaurant_id = restaurant_id AND name = 'Lanches';

  -- Create menu items
  INSERT INTO menu_items (
    restaurant_id,
    category_id,
    name,
    description,
    price,
    image_url,
    is_available,
    is_featured,
    preparation_time,
    calories
  )
  VALUES 
    (
      restaurant_id,
      category_principais_id,
      'Baião de Dois',
      'Prato tradicional nordestino com arroz, feijão de corda, queijo coalho e carne seca.',
      39.90,
      'https://i.ytimg.com/vi/9TVEmlFxZGA/maxresdefault.jpg',
      true,
      true,
      35,
      450
    ),
    (
      restaurant_id,
      category_petiscos_id,
      'Acarajé',
      'Bolinho de feijão fradinho frito em azeite de dendê, recheado com vatapá, camarão e vinagrete.',
      25.90,
      'https://truffle-assets.tastemadecontent.net/14bd9e85-acaraje_l_thumb.jpg',
      true,
      true,
      20,
      320
    ),
    (
      restaurant_id,
      category_principais_id,
      'Carne de Sol com Macaxeira',
      'Carne de sol grelhada, acompanhada de macaxeira frita e manteiga de garrafa.',
      45.90,
      'https://espetinhodesucesso.com/wp-content/uploads/2024/10/Carne-de-sol-com-mandioca-na-panela-de-pressao.jpg',
      true,
      false,
      40,
      520
    ),
    (
      restaurant_id,
      category_sobremesas_id,
      'Cartola',
      'Sobremesa típica com banana frita, queijo coalho e canela.',
      18.90,
      'https://images.pexels.com/photos/6483421/pexels-photo-6483421.jpeg',
      true,
      false,
      15,
      280
    ),
    (
      restaurant_id,
      category_petiscos_id,
      'Caldinho de Feijão',
      'Caldo cremoso de feijão, temperado com bacon, calabresa e temperos nordestinos.',
      15.90,
      'https://images.pexels.com/photos/6726447/pexels-photo-6726447.jpeg',
      true,
      false,
      25,
      180
    ),
    (
      restaurant_id,
      category_lanches_id,
      'Tapioca Recheada',
      'Tapioca recheada com carne de sol, queijo coalho e banana.',
      22.90,
      'https://images.pexels.com/photos/5946431/pexels-photo-5946431.jpeg',
      true,
      false,
      15,
      350
    );

  -- Create default theme settings
  INSERT INTO theme_settings (
    restaurant_id,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    font_family,
    layout_style
  )
  VALUES (
    restaurant_id,
    '#1E1E1E',
    '#000000',
    '#FFD700',
    '#1E1E1E',
    '#FFFFFF',
    'Inter',
    'modern'
  );

  -- Create sample coupon
  INSERT INTO coupons (
    restaurant_id,
    code,
    name,
    description,
    discount_type,
    discount_value,
    minimum_order,
    max_uses,
    valid_until
  )
  VALUES (
    restaurant_id,
    'BEMVINDO10',
    'Desconto de Boas-vindas',
    'Ganhe 10% de desconto no seu primeiro pedido',
    'percentage',
    10.00,
    30.00,
    100,
    NOW() + INTERVAL '30 days'
  );

END $$;