import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
// import { toast } from "react-toastify";
import { Product } from "../types";

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
    //TODO: Buscar dados do localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO: Verificar se o produto existe no carrinho
      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );
      // TODO: Verifica o estoque
      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      // TODO:
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const cartProducts = [...cart];

      //TODO:checar se o id existe no carrinho
      const findProduct = cartProducts.find(
        (product) => product.id === productId
      );

      if (!findProduct) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const newCart = cartProducts.filter(
        (product) => product.id !== productId
      );

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO:
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`http://localhost:3333/stock/${productId}`);

      if (amount > stock.data.amount || amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newCart = [...cart];

      newCart.map((product) => {
        if (product.id === productId) {
          return (product.amount = amount);
        } else {
          return;
        }
      });

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO:
      toast.error("Erro na alteração de quantidade do produto");
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
