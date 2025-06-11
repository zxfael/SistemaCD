import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-primary-dark shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container-custom mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" className="h-10" />
            ) : (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
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
                <span className="text-xl font-bold text-white">Sabor Digital</span>
              </motion.div>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium hover:text-accent transition-colors ${
                location.pathname === '/' ? 'text-accent' : 'text-white'
              }`}
            >
              Página Inicial
            </Link>
            <Link 
              to="/services" 
              className={`font-medium hover:text-accent transition-colors ${
                location.pathname === '/services' ? 'text-accent' : 'text-white'
              }`}
            >
              Nossos Serviços
            </Link>
            <Link 
              to="/support" 
              className={`font-medium hover:text-accent transition-colors ${
                location.pathname === '/support' ? 'text-accent' : 'text-white'
              }`}
            >
              Suporte
            </Link>
          </nav>
          
          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <a 
              href="https://merry-moonbeam-9afe07.netlify.app"
              target="_blank"
              rel="noopener noreferrer" 
              className="btn btn-primary"
            >
              Demonstração
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-accent transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-primary-dark shadow-lg"
        >
          <div className="container-custom mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/' ? 'text-accent' : 'text-white'
                }`}
              >
                Página Inicial
              </Link>
              <Link 
                to="/services" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/services' ? 'text-accent' : 'text-white'
                }`}
              >
                Nossos Serviços
              </Link>
              <Link 
                to="/support" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/support' ? 'text-accent' : 'text-white'
                }`}
              >
                Suporte
              </Link>
              <a 
                href="https://fantastic-mousse-58292e.netlify.app/login"
                target="_blank"
                rel="noopener noreferrer" 
                className="btn btn-primary text-center"
              >
                Gerenciar
              </a>
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;