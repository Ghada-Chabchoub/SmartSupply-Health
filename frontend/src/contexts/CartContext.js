// src/contexts/CartContext.js
import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.productId === product._id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return prevCart.map(item =>
                        item.productId === product._id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    alert(`Stock insuffisant pour ${product.name}`);
                    return prevCart;
                }
            } else {
                if (product.stock > 0) {
                    return [...prevCart, {
                        productId: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        maxStock: product.stock
                    }];
                } else {
                    alert(`Produit ${product.name} en rupture de stock`);
                    return prevCart;
                }
            }
        });
    };

    const updateCartQuantity = (productId, newQuantity) => {
        setCart((prevCart) => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.productId !== productId);
            }
            const cartItem = prevCart.find(item => item.productId === productId);
            if (newQuantity <= cartItem.maxStock) {
                return prevCart.map(item =>
                    item.productId === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            } else {
                alert('Quantité demandée supérieure au stock disponible');
                return prevCart;
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]); // Reset cart to empty array
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, updateCartQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};