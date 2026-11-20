import { ImageOff } from 'lucide-react';

import { useCart } from '../context/CartContext.jsx';
import { formatMoney, toCents } from '../utils/money.js';
import QuantityControl from './QuantityControl.jsx';

import styles from './ProductCard.module.css';

/**
 * Tarjeta compacta del catálogo.
 * Los botones – y + modifican el mismo carrito que utiliza CartDrawer.
 */
export default function ProductCard({ product, onShowDetails }) {
    const { addItem, setQuantity, items } = useCart();

    const currentItem = items.find((item) => item.productId === product.id);
    const quantityInCart = currentItem?.quantity ?? 0;

    const cartIsFull = items.length >= 40 && !currentItem;
    const canIncrease = product.is_available && !cartIsFull && quantityInCart < 99;

    const emptyLabel = !product.is_available
        ? 'Agotado'
        : cartIsFull
            ? 'Carrito lleno'
            : 'Agregar al carrito';

    return (
        <article className={styles.productCard}>
            <div className={styles.imageContainer}>
                <button
                    type="button"
                    className={styles.imageButton}
                    onClick={() => onShowDetails(product.id)}
                    aria-label={`Ver detalles de ${product.name}`}
                    aria-haspopup="dialog"
                >
                    {product.image ? (
                        <img
                            className={styles.productImage}
                            src={product.image.url}
                            alt={product.image.alt || product.name}
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <span className={styles.imagePlaceholder}>
                            <ImageOff size={28} aria-hidden="true" />
                            <span>Imagen próximamente</span>
                        </span>
                    )}
                </button>

                {!product.is_available && (
                    <span className={styles.unavailableBadge}>
                        No disponible
                    </span>
                )}
            </div>

            <div className={styles.productContent}>
                <h3 className={styles.productTitle}>
                    <button
                        type="button"
                        className={styles.titleButton}
                        onClick={() => onShowDetails(product.id)}
                        aria-haspopup="dialog"
                    >
                        {product.name}
                    </button>
                </h3>

                {product.description && (
                    <p className={styles.productDescription}>
                        {product.description}
                    </p>
                )}

                <div className={styles.productFooter}>
                    <strong className={styles.price}>
                        {formatMoney(toCents(product.price), product.currency)}
                    </strong>

                    <div className={styles.quantityAction}>
                        <QuantityControl
                            productName={product.name}
                            quantity={quantityInCart}
                            onIncrease={() => addItem(product.id)}
                            onDecrease={() => setQuantity(product.id, quantityInCart - 1)}
                            canIncrease={canIncrease}
                            emptyLabel={emptyLabel}
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}
