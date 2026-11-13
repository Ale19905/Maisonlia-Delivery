// Información inicial del negocio.
// En una fase futura algunos datos podrán venir de Supabase.
export const store = {
    name: 'Maison Lia',
    subtitle: 'Gastronomie & Café',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'CUP'],
    whatsappNumber: '5354054978',
    openingHours: [
        {
            days: 'Lunes a sábado',
            hours: '10:00 a. m. – 10:00 p. m.'
        },
        {
            days: 'Domingos',
            hours: '10:00 a. m. – 8:00 p. m.'
        }
    ]
};

export function getWhatsAppUrl(
    message = 'Hola, quisiera consultar por los pedidos de Maison Lia.'
) {
    return `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
