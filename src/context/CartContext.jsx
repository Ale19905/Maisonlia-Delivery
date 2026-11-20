import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

import { calculateTotals } from '../utils/money.js';

const STORAGE_KEY = 'maisonlia:cart:v1';
const MAX_QUANTITY = 99;
const MAX_PRODUCTS = 40;

const CartContext = createContext(null);

// El navegador solamente guarda IDs y cantidades, nunca precios antiguos.
function readSavedCart() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        if (!Array.isArray(stored)) {
            return [];
        }

        const seen = new Set();

        return stored.filter((item) => {
            const valid =
                item &&
                typeof item.productId === 'string' &&
                item.productId.length > 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity >= 1 &&
                item.quantity <= MAX_QUANTITY &&
                !seen.has(item.productId) &&
                seen.size < MAX_PRODUCTS;

            if (valid) {
                seen.add(item.productId);
            }

            return valid;
        }).map(({ productId, quantity }) => ({ productId, quantity }));
    } catch {
        // La navegación privada puede bloquear localStorage.
        return [];
    }
}

export function CartProvider({ products, children }) {
    const [items, setItems] = useState(readSavedCart);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // El carrito sigue funcionando en memoria.
        }
    }, [items]);

    const productsById = useMemo(() => (
        new Map(products.map((product) => [product.id, product]))
    ), [products]);

    const lines = useMemo(() => (
        items.map(({ productId, quantity }) => ({
            productId,
            quantity,
            product: productsById.get(productId) || null
        }))
    ), [items, productsById]);

    const totalQuantity = items.reduce(
        (count, item) => count + item.quantity,
        0
    );

    const totals = useMemo(() => calculateTotals(lines), [lines]);

    const hasUnavailableItems = lines.some(
        ({ product }) => !product || !product.is_available
    );

    const addItem = useCallback((productId) => {
        const product = productsById.get(productId);

        if (!product?.is_available) {
            return;
        }

        setItems((currentItems) => {
            const existing = currentItems.find(
                (item) => item.productId === productId
            );

            if (existing) {
                return currentItems.map((item) => (
                    item.productId === productId
                        ? {
                            ...item,
                            quantity: Math.min(item.quantity + 1, MAX_QUANTITY)
                        }
                        : item
                ));
            }

            if (currentItems.length >= MAX_PRODUCTS) {
                return currentItems;
            }

            return [...currentItems, { productId, quantity: 1 }];
        });
    }, [productsById]);

    const setQuantity = useCallback((productId, quantity) => {
        const nextQuantity = Math.min(
            MAX_QUANTITY,
            Math.max(0, Math.trunc(Number(quantity) || 0))
        );

        setItems((currentItems) => (
            nextQuantity === 0
                ? currentItems.filter((item) => item.productId !== productId)
                : currentItems.map((item) => {
                    if (item.productId !== productId) {
                        return item;
                    }

                    // Si está agotado, solamente se puede disminuir.
                    const product = productsById.get(productId);
                    const allowedQuantity = product?.is_available
                        ? nextQuantity
                        : Math.min(nextQuantity, item.quantity);

                    return { ...item, quantity: allowedQuantity };
                })
        ));
    }, [productsById]);

    const removeItem = useCallback((productId) => {
        setItems((currentItems) => currentItems.filter(
            (item) => item.productId !== productId
        ));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);
    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    const value = {
        items,
        lines,
        totals,
        totalQuantity,
        hasUnavailableItems,
        isOpen,
        addItem,
        setQuantity,
        removeItem,
        clearCart,
        openCart,
        closeCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart debe utilizarse dentro de CartProvider.');
    }

    return context;
}
