import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ShoppingCart, Star, Clock, Utensils } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { getMenuItems, getCategories, getDefaultRestaurant } from '../lib/supabase';
import type { MenuItem, Category, Restaurant } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HomePage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addToCart } = useCart();

  useEffect(() => {
    document.title = 'Sabor Digital - Cardápio Digital';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant info
      const { data: restaurantData } = await getDefaultRestaurant();
      if (restaurantData) {
        setRestaurant(restaurantData);
        
        // Fetch menu items and categories for this restaurant
        const [menuResult, categoriesResult] = await Promise.all([
          getMenuItems(restaurantData.id),
          getCategories(restaurantData.id)
        ]);
        
        if (menuResult.data) setMenuItems(menuResult.data);
        if (categoriesResult.data) setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.promotional_price || item.price,
      quantity: 1,
      image: item.image_url || ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-primary to-primary-light">
        <div className="container-custom">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              {restaurant?.name || 'Sabor Digital'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              {restaurant?.description || 'Cardápio digital com os melhores pratos da culinária nordestina'}
            </motion.p>
            
            {restaurant?.phone && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center text-accent mb-8"
              >
                <Clock size={20} className="mr-2" />
                <span>Pedidos: Segunda a Domingo, 8h às 22h</span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-12">
        <div className="container-custom">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pratos..."
                  className="input w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="input pl-10 pr-8 appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-accent text-secondary'
                    : 'bg-primary-light text-white hover:bg-accent hover:text-secondary'
                }`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-accent text-secondary'
                      : 'bg-primary-light text-white hover:bg-accent hover:text-secondary'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Utensils size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum prato encontrado</h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? `Nenhum resultado para "${searchTerm}"`
                  : 'Não há pratos disponíveis nesta categoria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  onAddToCart={() => handleAddToCart(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  onAddToCart: () => void;
}

const MenuItemCard = ({ item, index, onAddToCart }: MenuItemCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const currentPrice = item.promotional_price || item.price;
  const hasDiscount = item.promotional_price && item.promotional_price < item.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_featured && (
            <span className="bg-accent text-secondary px-2 py-1 text-xs font-semibold rounded-full">
              Destaque
            </span>
          )}
          {hasDiscount && (
            <span className="bg-error text-white px-2 py-1 text-xs font-semibold rounded-full">
              Promoção
            </span>
          )}
          {item.is_vegetarian && (
            <span className="bg-success text-white px-2 py-1 text-xs font-semibold rounded-full">
              Vegetariano
            </span>
          )}
        </div>

        {/* Category */}
        {item.category && (
          <div className="absolute top-2 right-2">
            <span className="bg-primary-dark/80 text-white px-2 py-1 text-xs rounded-full">
              {item.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{item.name}</h3>
          {item.rating && (
            <div className="flex items-center text-accent">
              <Star size={14} className="fill-current" />
              <span className="text-sm ml-1">{item.rating}</span>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Info Row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          {item.preparation_time > 0 && (
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>{item.preparation_time} min</span>
            </div>
          )}
          {item.calories && (
            <div className="flex items-center">
              <span>{item.calories} cal</span>
            </div>
          )}
        </div>

        {/* Price and Add to Cart */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-accent font-bold text-lg">
                R$ {currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-gray-500 line-through text-sm">
                  R$ {item.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-700 rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 py-1 text-gray-400 hover:text-accent transition-colors"
              >
                -
              </button>
              <span className="px-2 py-1 min-w-[2rem] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-2 py-1 text-gray-400 hover:text-accent transition-colors"
              >
                +
              </button>
            </div>

            <button 
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  onAddToCart();
                }
                setQuantity(1);
              }}
              className="btn btn-primary flex items-center"
            >
              <ShoppingCart size={16} className="mr-1" />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;