import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);
      const { data: productStock } = await api.get<Stock>(
        `/stock/${productId}`
      );

      if (!productStock) {
        throw new Error();
      }

      if (productExists && productExists.amount + 1 > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        setCart((oldState) => {
          const newValue = oldState.map((item) =>
            item.id === productId ? { ...item, amount: item.amount + 1 } : item
          );

          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newValue));

          return newValue;
        });

        return;
      }

      const {data: product} = await api.get<Product>(`/products/${productId}`);

      setCart((oldState) => {
        const newValue = [...oldState, {...product, amount: 1}];

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newValue));

        return newValue;
      });
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productExists = cart.find(item => item.id === productId);

      if (!productExists) {
        throw new Error();
      }

      setCart(oldState => {
        const newValue = oldState.filter(item => item.id !== productId);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newValue));

        return newValue;
      });
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return;
      }

      const {data: productStock} = await api.get<Stock>(`/stock/${productId}`);

      if (!productStock) {
        throw new Error();
      }

      if (amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      setCart(oldState => {
        const newValue = oldState.map(item => item.id === productId ? {...item, amount} : item);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newValue));

        return newValue;
      })

    } catch {
      // TODO
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
