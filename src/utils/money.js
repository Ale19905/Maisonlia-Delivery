// Todas las operaciones monetarias se hacen en centavos enteros.
// La base de datos almacena los precios como NUMERIC(12,2).
export function toCents(amount) {
    const number = Number(amount);

    if (!Number.isFinite(number) || number < 0) {
        throw new Error('Se encontró un precio inválido.');
    }

    return Math.round((number + Number.EPSILON) * 100);
}

export function formatMoney(cents, currency) {
    const amount = new Intl.NumberFormat('es', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(cents / 100);

    return `${currency} ${amount}`;
}

export function calculateTotals(lines) {
    return lines.reduce((totals, line) => {
        if (!line.product || !line.product.is_available) {
            return totals;
        }

        const { price, currency } = line.product;
        const subtotal = toCents(price) * line.quantity;

        return {
            ...totals,
            [currency]: (totals[currency] || 0) + subtotal
        };
    }, {});
}

export function orderedCurrencies(totals) {
    return Object.keys(totals).sort((a, b) => {
        if (a === 'USD') return -1;
        if (b === 'USD') return 1;
        return a.localeCompare(b);
    });
}
