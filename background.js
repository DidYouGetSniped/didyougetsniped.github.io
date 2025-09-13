export function setRandomBackground({ maxImages = 21, folder = 'backgrounds', includePlain = true } = {}) {
    // normalize folder (no trailing slash)
    const base = folder.replace(/\/$/, '');

    // build image list
    const images = [];
    if (includePlain) images.push(`${base}/image.png`);
    for (let i = 1; i <= Math.max(0, Math.floor(maxImages)); i++) {
        images.push(`${base}/image${i}.png`);
    }

    const total = images.length;
    if (total === 0) {
        console.warn('setRandomBackground: no images in list');
        return;
    }

    // read last index safely
    const lastRaw = sessionStorage.getItem('lastBackgroundIndex');
    const lastIndex = lastRaw === null ? -1 : parseInt(lastRaw, 10);

    // pick a random index (avoid repeating last one when possible)
    let randomIndex = 0;
    if (total === 1) {
        randomIndex = 0;
    } else {
        let attempts = 0;
        do {
            randomIndex = Math.floor(Math.random() * total);
            attempts++;
        } while (randomIndex === lastIndex && attempts < 10);

        // if unlucky, pick the next index deterministically
        if (randomIndex === lastIndex && total > 1) {
            randomIndex = (lastIndex + 1) % total;
        }
    }

    const selected = images[randomIndex];

    // Preload and then apply (so we only set the background when the image is valid)
    const img = new Image();
    img.onload = () => {
        try {
            // set CSS variable (for your CSS that uses var(--background-image-url))
            document.body.style.setProperty('--background-image-url', `url("${selected}")`);
            // also directly set background-image as a fallback
            document.body.style.backgroundImage = `url("${selected}")`;
            // persist the index
            sessionStorage.setItem('lastBackgroundIndex', String(randomIndex));
            console.log(`setRandomBackground: applied ${selected} (index ${randomIndex})`);
        } catch (err) {
            console.error('setRandomBackground: error applying background', err);
        }
    };
    img.onerror = () => {
        console.error(`setRandomBackground: failed to load ${selected}`);
        // fallback to first image (if different)
        if (images[0] && selected !== images[0]) {
            document.body.style.setProperty('--background-image-url', `url("${images[0]}")`);
            document.body.style.backgroundImage = `url("${images[0]}")`;
            sessionStorage.setItem('lastBackgroundIndex', '0');
            console.log(`setRandomBackground: fallback to ${images[0]}`);
        }
    };
    img.src = selected;
}
