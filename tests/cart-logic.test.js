import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateTotals, formatMoney, toCents } from '../src/utils/money.js';
import { buildOrderMessage, hasCatalogChanges } from '../src/utils/order.js';

const burger = {
    id: 'burger',
    name: 'Hamburguesa clásica',
    price: 5.50,
    currency: 'USD',
    is_available: true
};

const beverage = {
    id: 'bebida',
    name: 'Refresco',
    price: 150.25,
    currency: 'CUP',
    is_available: true
};

const lines = [
    { productId: 'burger', product: burger, quantity: 2 },
    { productId: 'bebida', product: beverage, quantity: 1 }
];

test('trabaja con centavos y evita errores en subtotales', () => {
    assert.equal(toCents(5.50), 550);
    assert.equal(toCents(0.1) + toCents(0.2), 30);
    assert.equal(formatMoney(1100, 'USD'), 'USD 11,00');
});

test('mantiene separados los importes por moneda', () => {
    assert.deepEqual(calculateTotals(lines), { USD: 1100, CUP: 15025 });
});

test('genera un mensaje con cantidades, subtotales y observaciones', () => {
    const result = buildOrderMessage({
        lines,
        customerName: 'Ana',
        address: '',
        notes: 'Sin cebolla'
    });

    assert.match(result, /Hamburguesa clásica/);
    assert.match(result, /2 × USD 5,50 = USD 11,00/);
    assert.match(result, /CUP 150,25/);
    assert.match(result, /A coordinar por WhatsApp/);
    assert.match(result, /Sin cebolla/);
});

test('detecta los cambios de precio o disponibilidad antes de enviar', () => {
    assert.equal(hasCatalogChanges(lines, [burger, beverage]), false);
    assert.equal(
        hasCatalogChanges(lines, [{ ...burger, price: 5.75 }, beverage]),
        true
    );
    assert.equal(
        hasCatalogChanges(lines, [burger, { ...beverage, is_available: false }]),
        true
    );
    assert.equal(hasCatalogChanges(lines, [burger]), true);
});

test('no permite preparar mensajes con productos agotados', () => {
    assert.throws(() => buildOrderMessage({
        lines: [{ productId: 'burger', quantity: 1, product: { ...burger, is_available: false } }],
        customerName: '',
        address: '',
        notes: ''
    }));
});
