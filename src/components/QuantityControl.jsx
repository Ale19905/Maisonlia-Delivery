import { Minus, Plus } from 'lucide-react';

import styles from './QuantityControl.module.css';

/**
 * Control reutilizable de cantidad.
 *
 * 0 unidades: un único botón claro para agregar.
 * 1 o más: botón – a la izquierda, cantidad en el centro y + a la derecha.
 * La cantidad se guarda en CartContext, no dentro de este componente.
 */
export default function QuantityControl({
    productName,
    quantity,
    onIncrease,
    onDecrease,
    canIncrease = true,
    disabled = false,
    emptyLabel = 'Agregar al carrito'
}) {
    if (quantity === 0) {
        return (
            <button
                type="button"
                className={styles.addButton}
                onClick={onIncrease}
                disabled={disabled || !canIncrease}
                aria-label={`${emptyLabel}: ${productName}`}
            >
                {canIncrease && <Plus size={17} aria-hidden="true" />}
                <span>{emptyLabel}</span>
            </button>
        );
    }

    return (
        <div
            className={styles.stepper}
            role="group"
            aria-label={`Cantidad de ${productName} en el carrito`}
        >
            <button
                type="button"
                className={styles.decreaseButton}
                onClick={onDecrease}
                disabled={disabled}
                aria-label={`Quitar una unidad de ${productName}`}
                title="Restar una unidad"
            >
                <Minus size={19} aria-hidden="true" />
            </button>

            <span className={styles.quantity} aria-live="polite" aria-atomic="true">
                {quantity}
            </span>

            <button
                type="button"
                className={styles.increaseButton}
                onClick={onIncrease}
                disabled={disabled || !canIncrease}
                aria-label={`Agregar una unidad de ${productName}`}
                title={!canIncrease ? 'No se pueden agregar más unidades' : 'Sumar una unidad'}
            >
                <Plus size={19} aria-hidden="true" />
            </button>
        </div>
    );
}
