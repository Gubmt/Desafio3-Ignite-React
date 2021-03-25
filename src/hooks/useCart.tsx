import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if  (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`stock/${productId}`);
      const productExists = cart.find(c => c.id === productId);

        if(productExists){
          if(productExists.amount < stock.data.amount) {
            const newCart = cart.map(c => c.id === productId ? {
              ...c,
              amount: c.amount + 1,
            } : c);
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          const product = await api.get(`products/${productId}`);
          setCart(cart => [...cart, { ...product.data, amount: 1}]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product.data, amount: 1}]));
        }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(c => c.id === productId);
      if(!!product){
        const newCart = cart.filter(c => c.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product = cart.find(c => c.id === productId);
        if(!!product) {
          const stock = await api.get(`stock/${productId}`);
          if(amount > 0 && amount <= stock.data.amount) {
            const newCart = cart.map(c => c.id === productId ? {
              ...c,
              amount: amount,
            } : c);
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          toast.error('Erro na alteração de quantidade do produto');
        }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
