export function setRandomBackground() {
    const MAX_IMAGES = 21;
    const backgroundImages = [];

    // ✅ Matches your files: image1.png through image21.png
    for (let i = 1; i <= MAX_IMAGES; i++) {
        backgroundImages.push(`/backgrounds/image${i}.png`);
    }

    const lastIndex = parseInt(sessionStorage.getItem('lastBackgroundIndex'), 10);
    const totalImages = backgroundImages.length;
    let randomIndex;

    do {
        randomIndex = Math.floor(Math.random() * totalImages);
    } while (totalImages > 1 && randomIndex === lastIndex);

    const selectedImage = backgroundImages[randomIndex];

    document.body.style.setProperty('--background-image-url', `url('${selectedImage}')`);

    sessionStorage.setItem('lastBackgroundIndex', randomIndex);
}
