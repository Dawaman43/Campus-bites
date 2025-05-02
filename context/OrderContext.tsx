import React, { createContext, useContext, useState } from 'react';

export type FoodItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
};

type OrderContextType = {
  orderItems: FoodItem[];
  addToCart: (foodItem: FoodItem) => void;
  removeFromOrder: (foodId: string) => void;
  clearOrder: () => void;
};

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

type Props = {
  children: React.ReactNode;
};

export const OrderProvider = ({ children }: Props) => {
  const [orderItems, setOrderItems] = useState<FoodItem[]>([]);

  const addToCart = (foodItem: FoodItem) => {
    setOrderItems((prevItems) => [...prevItems, foodItem]);
  };

  const removeFromOrder = (foodId: string) => {
    setOrderItems((prevItems) => prevItems.filter(item => item.id !== foodId));
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  return (
    <OrderContext.Provider value={{ orderItems, addToCart, removeFromOrder, clearOrder }}>
      {children}
    </OrderContext.Provider>
  );
};
