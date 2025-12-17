import React, { createContext, useContext, useEffect, useState } from "react";
import { getCartInfo, type CartInfo } from "./drugsApi";

type CartContextValue = {
  cart: CartInfo;
  refresh: () => Promise<CartInfo | undefined>;
  fetchOnPageEnter: () => Promise<CartInfo | undefined>;
  fetchOnClick: () => Promise<CartInfo | undefined>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartInfo>({ estimation_request_id: 0, count: 0 });

  const fetch = async (): Promise<CartInfo | undefined> => {
    try {
      const info = await getCartInfo();
      setCart(info);
      return info;
    } catch (err) {
      
      return undefined;
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  
  let currentFetch: Promise<CartInfo | undefined> | null = null;

  const doFetch = (): Promise<CartInfo | undefined> => {
    
    if (currentFetch) {
      return currentFetch;
    }

    currentFetch = (async () => {
      try {
        const info = await getCartInfo();
        setCart(info);
        return info;
      } catch (err) {
        return undefined;
      }
    })();

    currentFetch.then(() => {
      currentFetch = null;
    });

    return currentFetch;
  };

  const refresh = async () => {
    return await doFetch();
  };

  
  const fetchOnPageEnter = async () => {
    return await doFetch();
  };

  
  const fetchOnClick = async () => {
    return await doFetch();
  };

  return <CartContext.Provider value={{ cart, refresh, fetchOnPageEnter, fetchOnClick }}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

export default CartContext;
