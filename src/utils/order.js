import {
    calculateTotals,
    formatMoney,
    orderedCurrencies,
    toCents
} from './money.js';

// Construye el texto que el cliente revisará y enviará en WhatsApp.
// No guarda datos personales ni registra pedidos en Supabase.
export function buildOrderMessage({ lines, customerName, address, notes }) {
    if (!lines.length || lines.some((line) => !line.product?.is_available)) {
        throw new Error('El pedido contiene productos no disponibles.');
    }

    const text = [
        '*Pedido para Maison Lia*',
        '',
        '*Productos:*'
    ];

    lines.forEach(({ product, quantity }, index) => {
        const unitPrice = toCents(product.price);
        const subtotal = unitPrice * quantity;

        text.push(
            `${index + 1}. ${product.name}`,
            `   ${quantity} × ${formatMoney(unitPrice, product.currency)} = ${formatMoney(subtotal, product.currency)}`
        );
    });

    const totals = calculateTotals(lines);

    text.push('', '*Total de productos:*');

    orderedCurrencies(totals).forEach((currency) => {
        text.push(formatMoney(totals[currency], currency));
    });

    text.push('', '*Entrega:* A coordinar por WhatsApp');

    if (customerName.trim()) {
        text.push(`*Nombre:* ${customerName.trim()}`);
    }

    if (address.trim()) {
        text.push(`*Dirección o referencia:* ${address.trim()}`);
    }

    if (notes.trim()) {
        text.push('', `*Observaciones:* ${notes.trim()}`);
    }

    text.push(
        '',
        'Los precios y la disponibilidad están sujetos a confirmación del negocio.',
        'El costo de envío se coordina por este medio.'
    );

    return text.join('\n');
}

// Evita enviar información anterior si el catálogo cambió mientras
// el cliente preparaba su compra.
export function hasCatalogChanges(lines, latestProducts) {
    const productsById = new Map(
        latestProducts.map((product) => [product.id, product])
    );

    return lines.some(({ product, productId }) => {
        const current = productsById.get(productId);

        if (!product || !current || !current.is_available) {
            return true;
        }

        return (
            current.name !== product.name ||
            current.currency !== product.currency ||
            toCents(current.price) !== toCents(product.price)
        );
    });
}
