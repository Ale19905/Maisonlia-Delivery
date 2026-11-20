import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ImageOff, X } from 'lucide-react';

import { useCart } from '../context/CartContext.jsx';
import { formatMoney, toCents } from '../utils/money.js';
import QuantityControl from './QuantityControl.jsx';

import styles from './ProductDetailsModal.module.css';

/**
 * Ficha ampliada de un producto.
 * Se muestra sobre el resto de la página mediante un portal.
 */
export default function ProductDetailsModal({ product, onClose }) {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const { items, addItem, setQuantity } = useCart();

    useEffect(() => {
        if (!product) {
            return undefined;
        }

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) {
                return;
            }

            const focusableElements = [
                ...dialogRef.current.querySelectorAll(
                    'button:not([disabled]), a[href], input:not([disabled])'
                )
            ];

            if (!focusableElements.length) {
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);

            if (previouslyFocused?.isConnected) {
                previouslyFocused.focus();
            }
        };
    }, [product?.id, onClose]);

    if (!product) {
        return null;
    }

    const currentItem = items.find((item) => item.productId === product.id);
    const quantityInCart = currentItem?.quantity ?? 0;
    const cartIsFull = items.length >= 40 && !currentItem;
    const canIncrease = product.is_available && !cartIsFull && quantityInCart < 99;

    const emptyLabel = !product.is_available
        ? 'Producto agotado'
        : cartIsFull
            ? 'Carrito lleno'
            : 'Agregar al carrito';

    return createPortal(
        <div
            className={styles.backdrop}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-detail-title"
                aria-describedby="product-detail-description"
                ref={dialogRef}
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    ref={closeButtonRef}
                    aria-label="Cerrar detalles del producto"
                >
                    <X size={22} aria-hidden="true" />
                </button>

                <div className={styles.imageContainer}>
                    {product.image ? (
                        <img
                            className={styles.productImage}
                            src={product.image.url}
                            alt={product.image.alt || product.name}
                        />
                    ) : (
                        <div className={styles.imagePlaceholder}>
                            <ImageOff size={36} aria-hidden="true" />
                            <span>Imagen próximamente</span>
                        </div>
                    )}
                </div>

                <div className={styles.content}>
                    {!product.is_available && (
                        <span className={styles.unavailable}>
                            No disponible
                        </span>
                    )}

                    <h2 id="product-detail-title">{product.name}</h2>

                    <p
                        className={styles.description}
                        id="product-detail-description"
                    >
                        {product.description || 'Sin descripción adicional.'}
                    </p>

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
            </section>
        </div>,
        document.body
    );
}
