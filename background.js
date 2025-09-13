export function setRandomBackground() {
    // Set the maximum number of images (excluding plain "image.png")
    const MAX_IMAGES = 21;

    // Start with plain "image.png"
    const backgroundImages = ['backgrounds/image.png'];

    // Then add image1.png through imageN.png (N = MAX_IMAGES)
    for (let i = 1; i <= MAX_IMAGES; i++) {
        backgroundImages.push(`backgrounds/image${i}.png`);
    }

    // 1. Get the INDEX of the last image used. We parse it as an integer.
    const lastIndex = parseInt(sessionStorage.getItem('lastBackgroundIndex'), 10);
    const totalImages = backgroundImages.length;
    let randomIndex;

    // 2. Use a do-while loop to generate a new random index.
    do {
        randomIndex = Math.floor(Math.random() * totalImages);
    } while (totalImages > 1 && randomIndex === lastIndex);

    // 3. Select the image from the array using our new, unique random index.
    const selectedImage = backgroundImages[randomIndex];

    // 4. Apply the new background image.
    document.body.style.setProperty('--background-image-url', `url('${selectedImage}')`);

    // 5. Save the NEW index for the next page load.
    sessionStorage.setItem('lastBackgroundIndex', randomIndex);
}
