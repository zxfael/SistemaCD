-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'customer',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO public
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO public
USING (auth.uid() = id);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    category text NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view menu items" ON public.menu_items
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert menu items" ON public.menu_items
FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update menu items" ON public.menu_items
FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete menu items" ON public.menu_items
FOR DELETE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id),
    total_amount numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    payment_method text NOT NULL,
    is_delivery boolean DEFAULT true,
    delivery_address text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update any order" ON public.orders
FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES menu_items(id),
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK ((SELECT user_id FROM orders WHERE id = order_items.order_id) = auth.uid());

CREATE POLICY "Users can view their own order items" ON public.order_items
FOR SELECT TO authenticated
USING ((SELECT user_id FROM orders WHERE id = order_items.order_id) = auth.uid());

CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create theme_settings table
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_color text DEFAULT '#1E1E1E',
    secondary_color text DEFAULT '#000000',
    accent_color text DEFAULT '#FFD700',
    background_image text,
    logo_url text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view theme settings" ON public.theme_settings
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage theme settings" ON public.theme_settings
FOR ALL TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');