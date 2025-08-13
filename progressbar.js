// progressbar.js

// Find all necessary HTML elements once when the module loads.
const progressContainer = document.getElementById('progress-container');
const progressUser = document.getElementById('progress-user');
const progressPercent = document.getElementById('progress-percent');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressBarTrack = document.querySelector('.progress-bar-track');

// A safety check in case the HTML elements aren't on the page.
if (!progressContainer) {
    console.error("Progress bar HTML elements not found. The progress bar will not function.");
}

/**
 * Makes the progress bar visible and sets its initial state.
 */
function show() {
    if (!progressContainer) return;
    progressContainer.style.display = 'block';
    update(0, 1, 'Initializing...'); // Set a default starting message
}

/**
 * Hides the progress bar.
 */
function hide() {
    if (!progressContainer) return;
    progressContainer.style.display = 'none';
}

/**
 * Updates the progress bar's state.
 * @param {number} done - The number of items completed.
 * @param {number} total - The total number of items.
 * @param {string} userLabel - The text to display (e.g., the user being fetched).
 */
function update(done, total, userLabel) {
    if (!progressContainer) return;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    progressUser.textContent = userLabel;
    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
    progressBarTrack.setAttribute('aria-valuenow', percent);
}

// Export the functions to make them available to other files (like app.js).
export const progressBar = {
    show,
    hide,
    update
};