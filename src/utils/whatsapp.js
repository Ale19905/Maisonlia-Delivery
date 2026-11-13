import { storeConfig } from '../config/store';

export function createWhatsAppLink(message) {
    const text = encodeURIComponent(message);
    return `https://wa.me/${storeConfig.whatsappNumber}?text=${text}`;
}
