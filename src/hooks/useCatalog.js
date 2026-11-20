import { useCallback, useEffect, useState } from 'react';

import { fetchCatalog } from '../services/catalog.js';

// El catálogo vive en App para que Catalog y CartDrawer compartan
// la misma información de productos y precios.
export function useCatalog() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isCurrentRequest = true;

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const catalog = await fetchCatalog();

                if (isCurrentRequest) {
                    setCategories(catalog.categories);
                    setProducts(catalog.products);
                }
            } catch (loadError) {
                if (isCurrentRequest) {
                    setError(loadError.message || 'Error al cargar el menú.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            isCurrentRequest = false;
        };
    }, [retryCount]);

    const retry = useCallback(() => {
        setRetryCount((count) => count + 1);
    }, []);

    // Revalidación justo antes de preparar el enlace de WhatsApp.
    const refreshCatalog = useCallback(async () => {
        const catalog = await fetchCatalog();

        setCategories(catalog.categories);
        setProducts(catalog.products);
        setError(null);

        return catalog;
    }, []);

    return {
        categories,
        products,
        isLoading,
        error,
        retry,
        refreshCatalog
    };
}
