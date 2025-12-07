(function () {
    console.log("Universal Tracker Initialized (Smart Mode)");

    const KVDB_URL = "https://kvdb.io/3kS2y2m5M8a5x3n1/events";

    function init() {
        document.addEventListener('click', function (e) {
            let target = e.target.closest('[data-track-product]');

            if (!target) {
                const btn = e.target.closest('button, a, input[type="submit"]');
                if (btn) {
                    const text = btn.innerText.toLowerCase();
                    const isAddToCart = text.includes('ajouter au panier') || text.includes('add to cart');

                    if (isAddToCart) {
                        const productInfo = scrapeProductDetails();
                        trackEvent(productInfo.name, productInfo.price);
                        return;
                    }
                }
            } else {
                const productName = target.getAttribute('data-track-product') || "Unknown Product";
                const productPrice = target.getAttribute('data-track-price') || "0";
                trackEvent(productName, productPrice);
            }
        });
    }

    function scrapeProductDetails() {
        let name = "Unknown Product";
        let price = "0";

        const h1 = document.querySelector('h1');
        if (h1) name = h1.innerText.trim();

        const priceElement = document.querySelector('.price, .product-price, .money, .current-price');
        if (priceElement) {
            price = cleanPrice(priceElement.innerText);
        } else {
            const bodyText = document.body.innerText;
            const priceMatch = bodyText.match(/(\d+[.,]\d{2})\s?€/);
            if (priceMatch) price = cleanPrice(priceMatch[1]);
        }

        return { name, price };
    }

    function cleanPrice(priceStr) {
        return priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
    }

    async function trackEvent(product, price) {
        const payload = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            domain: window.location.hostname,
            product: product,
            price: price
        };

        console.log("Sending Event:", payload);

        try {
            // Get existing events
            const res = await fetch(KVDB_URL);
            let events = [];
            if (res.status !== 404) {
                const text = await res.text();
                events = text ? JSON.parse(text) : [];
            }

            // Add new event
            events.push(payload);
            if (events.length > 100) events.shift();

            // Save back
            await fetch(KVDB_URL, {
                method: 'POST',
                body: JSON.stringify(events)
            });

            console.log("Event tracked successfully");
        } catch (err) {
            console.error("Tracking failed", err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
