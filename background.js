export function setRandomBackground() {
    const backgroundImages = [
        'backgrounds/image.png',
        'backgrounds/image1.png',
        'backgrounds/image2.png',
        'backgrounds/image3.png',
        'backgrounds/image4.png',
        'backgrounds/image5.png',
        'backgrounds/image6.png',
        'backgrounds/image7.png',
        'backgrounds/image8.png',
        'backgrounds/image9.png',
        'backgrounds/image10.png',
        'backgrounds/image11.png',
        'backgrounds/image12.png',
        'backgrounds/image13.png',
        'backgrounds/image14.png',
        'backgrounds/image15.png',
        'backgrounds/image16.png'
    ];

    // 1. Get the INDEX of the last image used. We parse it as an integer.
    const lastIndex = parseInt(sessionStorage.getItem('lastBackgroundIndex'), 10);
    const totalImages = backgroundImages.length;
    let randomIndex;

    // 2. Use a do-while loop to generate a new random index.
    //    The loop will continue as long as the new index is the same as the last one.
    //    This guarantees the new index will be different (unless there's only one image).
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