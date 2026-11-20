import { useEffect, useRef, useState } from 'react';
import {
    ArrowRight,
    MessageCircle,
    ShoppingCart,
    Trash2,
    X
} from 'lucide-react';

import { useCart } from '../context/CartContext.jsx';
import { getWhatsAppUrl } from '../config/store.js';
import { buildOrderMessage, hasCatalogChanges } from '../utils/order.js';
import { formatMoney, orderedCurrencies, toCents } from '../utils/money.js';
import QuantityControl from './QuantityControl.jsx';

import styles from './CartDrawer.module.css';

function TotalSummary({ totals }) {
    const currencies = orderedCurrencies(totals);

    if (!currencies.length) {
        return <span>Sin productos disponibles</span>;
    }

    return (
        <div className={styles.totalValues}>
            {currencies.map((currency) => (
                <strong key={currency}>
                    {formatMoney(totals[currency], currency)}
                </strong>
            ))}
        </div>
    );
}

function CartLine({ line, locked }) {
    const { productId, quantity, product } = line;
    const { setQuantity, removeItem } = useCart();
    const available = Boolean(product?.is_available);

    return (
        <li className={styles.cartLine}>
            <div className={styles.lineInfo}>
                <strong>{product?.name || 'Producto retirado del menú'}</strong>

                {available ? (
                    <span className={styles.linePrice}>
                        {formatMoney(toCents(product.price), product.currency)} c/u
                    </span>
                ) : (
                    <span className={styles.unavailable}>
                        Ya no disponible — eliminá este producto
                    </span>
                )}

            </div>

            {available && (
                <strong className={styles.lineSubtotal}>
                    {formatMoney(
                        toCents(product.price) * quantity,
                        product.currency
                    )}
                </strong>
            )}

            <div className={styles.quantityControls}>
                <div className={styles.cartQuantityAction}>
                    <QuantityControl
                        productName={product?.name || 'producto'}
                        quantity={quantity}
                        onIncrease={() => setQuantity(productId, quantity + 1)}
                        onDecrease={() => setQuantity(productId, quantity - 1)}
                        canIncrease={available && quantity < 99}
                        disabled={locked}
                    />
                </div>

                <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={`Eliminar ${product?.name || 'producto'} del carrito`}
                    onClick={() => removeItem(productId)}
                    disabled={locked}
                >
                    <Trash2 size={17} aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}

export default function CartDrawer({ isCatalogLoading, onRefreshCatalog }) {
    const {
        lines,
        totals,
        totalQuantity,
        hasUnavailableItems,
        isOpen,
        closeCart,
        openCart,
        clearCart
    } = useCart();

    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [whatsAppFallbackUrl, setWhatsAppFallbackUrl] = useState('');
    const [successNotice, setSuccessNotice] = useState('');
    const drawerRef = useRef(null);
    const closeButtonRef = useRef(null);
    const triggerRef = useRef(null);
    const submittingRef = useRef(false);
    submittingRef.current = isSubmitting;

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        triggerRef.current = document.activeElement;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        function onKeyDown(event) {
            if (event.key === 'Escape' && !submittingRef.current) {
                closeCart();
                return;
            }

            if (event.key !== 'Tab' || !drawerRef.current) {
                return;
            }

            const focusable = [...drawerRef.current.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
            )];

            if (!focusable.length) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            triggerRef.current?.focus();
        };
    }, [isOpen, closeCart]);

    async function handleCheckout(event) {
        event.preventDefault();
        setMessage('');
        setSuccessNotice('');
        setWhatsAppFallbackUrl('');

        if (!lines.length || hasUnavailableItems || isCatalogLoading) {
            setMessage('Revisá los productos de tu carrito antes de continuar.');
            return;
        }

        // IMPORTANTE: se abre durante el evento del usuario, antes del await.
        // Abrirla después de consultar Supabase podría activar el bloqueador
        // de ventanas emergentes del navegador.
        const whatsAppTab = window.open('about:blank', '_blank');
        let navigatedToWhatsApp = false;

        if (whatsAppTab) {
            // No dar a la nueva pestaña acceso a la página original.
            whatsAppTab.opener = null;

            // Mensaje provisional mientras verificamos el catálogo.
            // El texto es fijo: nunca insertamos datos del usuario como HTML.
            whatsAppTab.document.title = 'Preparando pedido | Maison Lia';
            whatsAppTab.document.body.style.cssText = [
                'font-family: system-ui, sans-serif',
                'padding: 32px',
                'line-height: 1.6',
                'color: #211a15'
            ].join(';');
            whatsAppTab.document.body.textContent =
                'Maison Lia está verificando tu pedido. Podés volver a la tienda mientras se prepara WhatsApp.';
        }

        setIsSubmitting(true);

        try {
            // Consultamos Supabase para evitar enviar precios desactualizados.
            const latestCatalog = await onRefreshCatalog();

            if (hasCatalogChanges(lines, latestCatalog.products)) {
                setMessage(
                    'El menú cambió. Actualizamos tu carrito: revisá precios y disponibilidad antes de continuar.'
                );
                return;
            }

            const latestById = new Map(
                latestCatalog.products.map((product) => [product.id, product])
            );

            const validatedLines = lines.map((line) => ({
                ...line,
                product: latestById.get(line.productId)
            }));

            const orderMessage = buildOrderMessage({
                lines: validatedLines,
                customerName,
                address,
                notes
            });

            if (orderMessage.length > 3500) {
                setMessage(
                    'El pedido es demasiado largo. Reducí las observaciones o la cantidad de productos.'
                );
                return;
            }

            const whatsAppUrl = getWhatsAppUrl(orderMessage);

            if (whatsAppTab && !whatsAppTab.closed) {
                // Redirigimos solamente la pestaña nueva, nunca Maison Lia.
                whatsAppTab.location.replace(whatsAppUrl);
                navigatedToWhatsApp = true;

                setSuccessNotice(
                    'WhatsApp se abrió por separado. Revisá y enviá allí tu mensaje para completar el pedido.'
                );
            } else {
                // Si se bloqueó la nueva pestaña o el usuario la cerró,
                // mostramos un enlace real que puede abrirse con otro clic.
                setWhatsAppFallbackUrl(whatsAppUrl);
                setMessage(
                    'Tu pedido está listo. Usá el enlace siguiente para abrir WhatsApp.'
                );
            }
        } catch (checkoutError) {
            setMessage(
                'No pudimos verificar el catálogo. Revisá tu conexión e intentá nuevamente.'
            );
            console.error('Error al preparar el pedido:', checkoutError);
        } finally {
            // Cerrar la pestaña provisional si la validación falló.
            if (whatsAppTab && !navigatedToWhatsApp && !whatsAppTab.closed) {
                whatsAppTab.close();
            }

            setIsSubmitting(false);
        }
    }

    return (
        <>
            {!isOpen && totalQuantity > 0 && (
                <button
                    className={styles.mobileBar}
                    type="button"
                    onClick={openCart}
                >
                    <span className={styles.mobileBarLeft}>
                        <ShoppingCart size={20} aria-hidden="true" />
                        Ver carrito ({totalQuantity})
                    </span>
                    <span className={styles.mobileBarRight}>
                        <TotalSummary totals={totals} />
                        <ArrowRight size={17} aria-hidden="true" />
                    </span>
                </button>
            )}

            {isOpen && (
                <div
                    className={styles.backdrop}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isSubmitting) {
                            closeCart();
                        }
                    }}
                >
                    <section
                        className={styles.drawer}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cart-title"
                        ref={drawerRef}
                    >
                        <div className={styles.drawerHeader}>
                            <div>
                                <span className={styles.eyebrow}>Tu pedido</span>
                                <h2 id="cart-title" className={styles.cartTitle}>
                                    <ShoppingCart size={26} aria-hidden="true" />
                                    Carrito
                                </h2>
                            </div>

                            <button
                                className={styles.closeButton}
                                type="button"
                                aria-label="Cerrar carrito"
                                ref={closeButtonRef}
                                onClick={closeCart}
                                disabled={isSubmitting}
                            >
                                <X size={22} aria-hidden="true" />
                            </button>
                        </div>

                        {isCatalogLoading ? (
                            <p className={styles.emptyState} role="status">
                                Comprobando los productos del carrito...
                            </p>
                        ) : lines.length === 0 ? (
                            <div className={styles.emptyState}>
                                <ShoppingCart size={36} aria-hidden="true" />
                                <h3>Tu carrito está vacío</h3>
                                <p>Elegí tus productos favoritos en el menú.</p>
                                <button type="button" onClick={closeCart}>
                                    Seguir explorando
                                </button>
                            </div>
                        ) : (
                            <form className={styles.checkout} onSubmit={handleCheckout}>
                                <div className={styles.orderListHeader}>
                                    <span>{totalQuantity} unidades</span>
                                    <button
                                        type="button"
                                        className={styles.clearButton}
                                        onClick={clearCart}
                                        disabled={isSubmitting}
                                    >
                                        Vaciar carrito
                                    </button>
                                </div>

                                <ul className={styles.cartLines}>
                                    {lines.map((line) => (
                                        <CartLine
                                            key={line.productId}
                                            line={line}
                                            locked={isSubmitting}
                                        />
                                    ))}
                                </ul>

                                {hasUnavailableItems && (
                                    <p className={styles.alert} role="alert">
                                        Eliminá los productos no disponibles para poder continuar.
                                    </p>
                                )}

                                <div className={styles.totals}>
                                    <span>Subtotal de productos</span>
                                    <TotalSummary totals={totals} />
                                </div>

                                <p className={styles.shippingNote}>
                                    El envío y su costo se coordinan directamente con el negocio.
                                    No se cobra desde esta web.
                                </p>

                                <fieldset className={styles.fields} disabled={isSubmitting}>
                                    <legend>Datos opcionales del pedido</legend>

                                    <label htmlFor="cart-customer-name">Tu nombre</label>
                                    <input
                                        id="cart-customer-name"
                                        name="customerName"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Ej. María"
                                        maxLength={80}
                                        value={customerName}
                                        onChange={(event) => setCustomerName(event.target.value)}
                                    />

                                    <label htmlFor="cart-address">Dirección o referencia (opcional)</label>
                                    <input
                                        id="cart-address"
                                        name="address"
                                        type="text"
                                        autoComplete="street-address"
                                        placeholder="También podés coordinarla por WhatsApp"
                                        maxLength={180}
                                        value={address}
                                        onChange={(event) => setAddress(event.target.value)}
                                    />

                                    <label htmlFor="cart-notes">Observaciones del pedido</label>
                                    <textarea
                                        id="cart-notes"
                                        name="notes"
                                        placeholder="Ej. La hamburguesa sin cebolla"
                                        rows={3}
                                        maxLength={500}
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                    />
                                </fieldset>

                                {message && (
                                    <p className={styles.alert} role="alert">
                                        {message}
                                    </p>
                                )}

                                {whatsAppFallbackUrl && (
                                    <a
                                        className={styles.whatsAppFallback}
                                        href={whatsAppFallbackUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MessageCircle size={19} aria-hidden="true" />
                                        Abrir WhatsApp en otra pestaña
                                    </a>
                                )}

                                {successNotice && (
                                    <p className={styles.successNotice} role="status">
                                        {successNotice}
                                    </p>
                                )}

                                <button
                                    className={styles.whatsappCheckout}
                                    type="submit"
                                    disabled={hasUnavailableItems || isSubmitting}
                                >
                                    <MessageCircle size={20} aria-hidden="true" />
                                    {isSubmitting ? 'Verificando precios...' : 'Continuar en WhatsApp'}
                                </button>

                                <p className={styles.disclaimer}>
                                    WhatsApp abrirá un mensaje listo para revisar.
                                    Tendrás que pulsar Enviar allí para compartir el pedido.
                                    El negocio confirmará precio final, disponibilidad y entrega.
                                </p>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
