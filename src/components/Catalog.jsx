import { useEffect, useMemo, useState } from 'react';
import { ImageOff, RefreshCw, Search, ShoppingBag } from 'lucide-react';

import { fetchCatalog } from '../services/catalog.js';
import styles from './Catalog.module.css';

const ALL_CATEGORIES = 'all';

function formatPrice(price, currency) {
    const formattedAmount = new Intl.NumberFormat('es', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);

    return `${currency} ${formattedAmount}`;
}

function ProductCard({ product }) {
    return (
        <article className={styles.productCard}>
            <div className={styles.imageContainer}>
                {product.image ? (
                    <img
                        className={styles.productImage}
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <ImageOff size={30} aria-hidden="true" />
                        <span>Imagen próximamente</span>
                    </div>
                )}

                {!product.is_available && (
                    <span className={styles.unavailableBadge}>
                        No disponible
                    </span>
                )}
            </div>

            <div className={styles.productContent}>
                <h3>{product.name}</h3>

                {product.description && (
                    <p className={styles.productDescription}>
                        {product.description}
                    </p>
                )}

                <div className={styles.productFooter}>
                    <strong className={styles.price}>
                        {formatPrice(product.price, product.currency)}
                    </strong>

                    <span className={styles.comingSoon}>
                        {product.is_available
                            ? 'Carrito próximamente'
                            : 'Agotado'}
                    </span>
                </div>
            </div>
        </article>
    );
}

export default function Catalog() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCatalog() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchCatalog();

                if (isCurrentRequest) {
                    setCategories(result.categories);
                    setProducts(result.products);
                }
            } catch (loadError) {
                console.error('Error al cargar el catálogo:', loadError);

                if (isCurrentRequest) {
                    setError(loadError.message);
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        loadCatalog();

        return () => {
            isCurrentRequest = false;
        };
    }, [reloadCount]);

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
                    onClick={() => setReloadCount((count) => count + 1)}
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
                <ShoppingBag size={30} aria-hidden="true" />
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
                    className={categoryId === ALL_CATEGORIES ? styles.activeCategory : styles.category}
                    onClick={() => setCategoryId(ALL_CATEGORIES)}
                    aria-pressed={categoryId === ALL_CATEGORIES}
                >
                    Todos
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        className={categoryId === category.id ? styles.activeCategory : styles.category}
                        onClick={() => setCategoryId(category.id)}
                        aria-pressed={categoryId === category.id}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <p className={styles.resultCount} aria-live="polite">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>

            {filteredProducts.length > 0 ? (
                <div className={styles.productGrid}>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
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
        </div>
    );
}
