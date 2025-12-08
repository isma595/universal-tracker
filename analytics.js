(function () {
    console.log("Universal Tracker Initialized (JSONBin Mode)");

    const BIN_ID = "693623f243b1c97be9de9fb9";
    const API_KEY = "$2a$10$U0a6/cNNJLnse/Et4gmhseuynJnqHMgp6.hmVe13pRHtnmGAyEWCG";
    const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

        // Get product name from h1
        const h1 = document.querySelector('h1');
        if (h1) name = h1.innerText.trim();

        // Try multiple price selectors
        const priceSelectors = [
            '.price',
            '.product-price',
            '.money',
            '.current-price',
            '[class*="price"]',
            '[class*="Prix"]'
        ];

        let priceElement = null;
        for (const selector of priceSelectors) {
            priceElement = document.querySelector(selector);
            if (priceElement) break;
        }

        if (priceElement) {
            price = cleanPrice(priceElement.innerText);
        } else {
            // Fallback: search for price pattern in page text
            const bodyText = document.body.innerText;
            const priceMatch = bodyText.match(/(\d+[.,]\d{2})\s*€/);
            if (priceMatch) price = cleanPrice(priceMatch[1]);
        }

        console.log("Scraped product:", { name, price });
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
            const res = await fetch(BIN_URL, {
                headers: {
                    'X-Master-Key': API_KEY,
                    'X-Access-Key': API_KEY
                }
            });

            let events = [];
            if (res.ok) {
                const data = await res.json();
                // Check if data is wrapped in record.events (our structure) or just record (raw array)
                if (data.record && Array.isArray(data.record.events)) {
                    events = data.record.events;
                } else if (Array.isArray(data.record)) {
                    events = data.record;
                }
            }

            // Add new event
            events.push(payload);
            if (events.length > 100) events.shift();

            // Save back
            await fetch(BIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify({ events: events })
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
