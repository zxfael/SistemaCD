import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Database types for strongly typed queries
export type Profile = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'customer';
  status: string;
  email_verified: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  address?: any;
  phone?: string;
  email?: string;
  website?: string;
  opening_hours?: any;
  delivery_fee: number;
  minimum_order: number;
  delivery_radius: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  promotional_price?: number;
  image_url?: string;
  images?: string[];
  ingredients?: string[];
  allergens?: string[];
  nutritional_info?: any;
  preparation_time: number;
  calories?: number;
  is_available: boolean;
  is_featured: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  stock_quantity?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type MenuItemVariant = {
  id: string;
  menu_item_id: string;
  name: string;
  options: any[];
  is_required: boolean;
  max_selections: number;
  created_at: string;
};

export type Order = {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: any;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'online';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  notes?: string;
  rating?: number;
  review?: string;
  coupon_code?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  restaurant?: Restaurant;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id?: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variants?: any;
  special_instructions?: string;
  created_at: string;
  menu_item?: MenuItem;
};

export type Coupon = {
  id: string;
  restaurant_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ThemeSettings = {
  id: string;
  restaurant_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  logo_url?: string;
  favicon_url?: string;
  background_image?: string;
  custom_css?: string;
  layout_style: string;
  created_at: string;
  updated_at: string;
};

export type Analytics = {
  id: string;
  restaurant_id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  most_popular_item?: string;
  page_views: number;
  unique_visitors: number;
  conversion_rate: number;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  restaurant_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  restaurant_id: string;
  order_id?: string;
  customer_name: string;
  customer_email?: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
};

// Helper functions for common queries
export const getDefaultRestaurant = async () => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active')
    .single();
  
  return { data, error };
};

export const getMenuItems = async (restaurantId?: string) => {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_available', true)
    .order('sort_order');

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getCategories = async (restaurantId?: string) => {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getThemeSettings = async (restaurantId?: string) => {
  let query = supabase
    .from('theme_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query.single();
  return { data, error };
};

export const createOrder = async (orderData: Partial<Order>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      order_number: `ORD-${Date.now()}`
    })
    .select()
    .single();

  return { data, error };
};

export const createOrderItems = async (orderItems: Partial<OrderItem>[]) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  return { data, error };
};