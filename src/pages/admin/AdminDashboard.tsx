import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, ShoppingBag, Clock, DollarSign, 
  TrendingUp, Users, Calendar, Menu, LogOut, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ExcelJS from 'exceljs';
import { supabase } from '../../lib/supabase';
import type { Order, Analytics } from '../../lib/supabase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileView, setMobileView] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('week');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = 'Sabor Digital - Painel Administrativo';
    
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
        setMobileView(true);
      } else {
        setShowSidebar(true);
        setMobileView(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    fetchDashboardData();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name),
          order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (ordersData) {
        setRecentOrders(ordersData);
      }
      
      // Fetch or calculate analytics for today
      const today = new Date().toISOString().split('T')[0];
      const { data: analyticsData } = await supabase
        .from('analytics')
        .select('*')
        .eq('date', today)
        .single();
      
      if (analyticsData) {
        setAnalytics(analyticsData);
      } else {
        // Calculate analytics if not exists
        await calculateTodayAnalytics();
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTodayAnalytics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;
      
      // Get today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);
      
      if (todayOrders) {
        const totalOrders = todayOrders.length;
        const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const analyticsData = {
          date: today,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue,
          page_views: Math.floor(Math.random() * 100) + 50, // Mock data
          unique_visitors: Math.floor(Math.random() * 50) + 25, // Mock data
          conversion_rate: totalOrders > 0 ? (totalOrders / 100) * 100 : 0 // Mock calculation
        };
        
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const exportToExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedidos');
    
    // Add headers
    worksheet.addRow(['ID', 'Cliente', 'Total', 'Status', 'Data', 'Itens']);
    
    // Add data
    recentOrders.forEach(order => {
      worksheet.addRow([
        order.order_number,
        order.customer_name,
        order.total_amount,
        order.order_status,
        new Date(order.created_at).toLocaleString('pt-BR'),
        order.order_items?.length || 0
      ]);
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Generate and download the file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pedidos.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  
  // Chart data
  const salesData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Vendas',
        data: [450, 530, 380, 620, 780, 950, 820],
        backgroundColor: 'rgba(255, 215, 0, 0.6)',
        borderColor: 'rgba(255, 215, 0, 1)',
        borderWidth: 2,
      },
    ],
  };
  
  const ordersData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Pedidos',
        data: [12, 15, 10, 18, 22, 28, 24],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#aaa',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#aaa',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };
  
  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };
  
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-primary-light text-white',
      confirmed: 'bg-warning/20 text-warning',
      preparing: 'bg-warning/20 text-warning',
      ready: 'bg-success/20 text-success',
      delivered: 'bg-success/20 text-success',
      cancelled: 'bg-error/20 text-error'
    };
    return colors[status as keyof typeof colors] || 'bg-primary-light text-white';
  };
  
  return (
    <div className="min-h-screen bg-primary flex">
      {/* Sidebar */}
      <aside 
        className={`bg-secondary w-64 fixed h-full z-20 transition-all duration-300 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } ${mobileView ? 'lg:translate-x-0' : ''}`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-accent mr-2"
            >
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
              <line x1="6" y1="17" x2="18" y2="17"></line>
            </svg>
            <span className="text-xl font-bold text-white">Admin</span>
          </div>
        </div>
        
        <nav className="py-6">
          <div className="px-4 mb-6">
            <div className="flex items-center">
              <div className="bg-primary-light rounded-full w-10 h-10 flex items-center justify-center mr-3">
                <User className="text-accent" />
              </div>
              <div>
                <div className="text-sm font-medium">{user?.name || user?.email}</div>
                <div className="text-xs text-gray-500">Administrador</div>
              </div>
            </div>
          </div>
          
          <ul>
            <li>
              <Link 
                to="/admin" 
                className="flex items-center px-4 py-3 bg-primary-light text-accent"
              >
                <BarChart2 className="mr-3" size={18} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/orders" 
                className="flex items-center px-4 py-3 text-white hover:bg-primary-light hover:text-accent transition-colors"
              >
                <ShoppingBag className="mr-3" size={18} />
                <span>Pedidos</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/menus" 
                className="flex items-center px-4 py-3 text-white hover:bg-primary-light hover:text-accent transition-colors"
              >
                <Menu className="mr-3" size={18} />
                <span>Cardápios</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/appearance" 
                className="flex items-center px-4 py-3 text-white hover:bg-primary-light hover:text-accent transition-colors"
              >
                <Users className="mr-3" size={18} />
                <span>Aparência</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={signOut}
                className="w-full flex items-center px-4 py-3 text-white hover:bg-primary-light hover:text-accent transition-colors"
              >
                <LogOut className="mr-3" size={18} />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className={`flex-1 p-6 transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md bg-primary-light"
          >
            <Menu />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={exportToExcel}
              className="btn btn-primary flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M8 13h2"/>
                <path d="M8 17h2"/>
                <path d="M14 13h2"/>
                <path d="M14 17h2"/>
              </svg>
              Exportar
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card flex items-center"
          >
            <div className="bg-accent/20 rounded-full p-4 mr-4">
              <DollarSign className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Vendas Hoje</h3>
              <p className="text-2xl font-bold">R$ {analytics?.total_revenue.toFixed(2) || '0,00'}</p>
              <span className="text-xs text-success flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12.5%
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card flex items-center"
          >
            <div className="bg-success/20 rounded-full p-4 mr-4">
              <ShoppingBag className="text-success" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Pedidos Hoje</h3>
              <p className="text-2xl font-bold">{analytics?.total_orders || 0}</p>
              <span className="text-xs text-success flex items-center">
                <TrendingUp size={12} className="mr-1" /> +8.2%
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="card flex items-center"
          >
            <div className="bg-warning/20 rounded-full p-4 mr-4">
              <Users className="text-warning" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Visitantes</h3>
              <p className="text-2xl font-bold">{analytics?.unique_visitors || 0}</p>
              <span className="text-xs text-success flex items-center">
                <TrendingUp size={12} className="mr-1" /> +5.1%
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="card flex items-center"
          >
            <div className="bg-primary-light rounded-full p-4 mr-4">
              <Clock className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Ticket Médio</h3>
              <p className="text-2xl font-bold">R$ {analytics?.avg_order_value.toFixed(2) || '0,00'}</p>
              <span className="text-xs text-error flex items-center">
                <TrendingUp size={12} className="mr-1" /> +2.5%
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Análise de Vendas</h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1 rounded-full text-sm ${
                periodFilter === 'week' ? 'bg-accent text-secondary' : 'bg-primary-light text-white'
              }`}
            >
              Semana
            </button>
            <button 
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1 rounded-full text-sm ${
                periodFilter === 'month' ? 'bg-accent text-secondary' : 'bg-primary-light text-white'
              }`}
            >
              Mês
            </button>
            <button 
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1 rounded-full text-sm ${
                periodFilter === 'year' ? 'bg-accent text-secondary' : 'bg-primary-light text-white'
              }`}
            >
              Ano
            </button>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold mb-4">Receita</h3>
            <div className="h-80">
              <Bar data={salesData} options={chartOptions} />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card"
          >
            <h3 className="text-lg font-semibold mb-4">Pedidos</h3>
            <div className="h-80">
              <Line data={ordersData} options={chartOptions} />
            </div>
          </motion.div>
        </div>
        
        {/* Recent Orders */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pedidos Recentes</h3>
            <Link to="/admin/orders" className="text-accent text-sm hover:underline">
              Ver Todos
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left">Pedido</th>
                  <th className="py-3 px-4 text-left">Cliente</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Data</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800">
                    <td className="py-3 px-4">#{order.order_number}</td>
                    <td className="py-3 px-4">{order.customer_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.order_status)}`}>
                        {getStatusLabel(order.order_status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(order.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">R$ {order.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;