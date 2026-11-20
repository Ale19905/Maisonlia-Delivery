import { useCallback, useMemo, useState } from 'react';
import { RefreshCw, Search, ShoppingCart } from 'lucide-react';

import ProductCard from './ProductCard.jsx';
import ProductDetailsModal from './ProductDetailsModal.jsx';

import styles from './Catalog.module.css';

const ALL_CATEGORIES = 'all';

/**
 * Catálogo: búsqueda, categorías y visualización de los productos.
 * Las tarjetas y la ficha ampliada viven en componentes independientes.
 */
export default function Catalog({
    categories,
    products,
    isLoading,
    error,
    onRetry
}) {
    const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
    const [search, setSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(null);

    const closeProductDetails = useCallback(() => {
        setSelectedProductId(null);
    }, []);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('es');

        return products.filter((product) => {
            const matchesCategory =
                categoryId === ALL_CATEGORIES ||
                product.category_id === categoryId;

            const searchableText = [
                product.name,
                product.description || ''
            ].join(' ').toLocaleLowerCase('es');

            return (
                matchesCategory &&
                searchableText.includes(normalizedSearch)
            );
        });
    }, [products, categoryId, search]);

    // Guardamos el ID, no una copia del producto: si el catálogo se actualiza,
    // la ficha utiliza los datos más recientes disponibles en memoria.
    const selectedProduct = products.find(
        (product) => product.id === selectedProductId
    ) ?? null;

    if (isLoading) {
        return (
            <div className={styles.statusBox} role="status">
                <div className={styles.spinner} aria-hidden="true" />
                <p>Cargando nuestro menú...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.statusBox} role="alert">
                <h3>No pudimos cargar el catálogo</h3>
                <p>Revisá la conexión y los ajustes de Supabase.</p>
                <button
                    className={styles.retryButton}
                    type="button"
                    onClick={onRetry}
                >
                    <RefreshCw size={17} aria-hidden="true" />
                    Volver a intentar
                </button>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className={styles.statusBox}>
                <ShoppingCart size={30} aria-hidden="true" />
                <h3>Estamos preparando el menú</h3>
                <p>Pronto encontrarás aquí nuestros productos.</p>
            </div>
        );
    }

    return (
        <div className={styles.catalog}>
            <label className={styles.searchField}>
                <Search size={20} aria-hidden="true" />
                <span className={styles.screenReaderOnly}>
                    Buscar productos
                </span>
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar en el menú..."
                />
            </label>

            <div
                className={styles.categories}
                role="group"
                aria-label="Filtrar por categoría"
            >
                <button
                    type="button"
                    className={
                        categoryId === ALL_CATEGORIES
                            ? styles.activeCategory
                            : styles.category
                    }
                    onClick={() => setCategoryId(ALL_CATEGORIES)}
                    aria-pressed={categoryId === ALL_CATEGORIES}
                >
                    Todos
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        className={
                            categoryId === category.id
                                ? styles.activeCategory
                                : styles.category
                        }
                        onClick={() => setCategoryId(category.id)}
                        aria-pressed={categoryId === category.id}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <p className={styles.resultCount} aria-live="polite">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>

            {filteredProducts.length > 0 ? (
                <div className={styles.productGrid}>
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onShowDetails={setSelectedProductId}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.statusBox}>
                    <Search size={28} aria-hidden="true" />
                    <h3>No encontramos resultados</h3>
                    <p>Probá con otra búsqueda o categoría.</p>
                    <button
                        type="button"
                        className={styles.retryButton}
                        onClick={() => {
                            setSearch('');
                            setCategoryId(ALL_CATEGORIES);
                        }}
                    >
                        Ver todos los productos
                    </button>
                </div>
            )}

            <ProductDetailsModal
                product={selectedProduct}
                onClose={closeProductDetails}
            />
        </div>
    );
}
