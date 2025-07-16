// utils.js

/**
 * Copies a string to the user's clipboard and provides feedback on a button.
 * @param {string} text - The text to copy.
 * @param {HTMLElement} buttonElement - The button that was clicked.
 */
export const copyToClipboard = (text, buttonElement) => {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Copied!';
        buttonElement.classList.add('copied');
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // This function can't display a message directly, so the caller should handle it.
    });
};

/**
 * Formats a UNIX timestamp into a human-readable date/time string.
 * @param {number} timestamp - The UNIX timestamp (in seconds).
 * @param {string} timeZone - The IANA time zone name (e.g., 'America/New_York') or 'local'.
 * @param {string} hourFormat - '12' for 12-hour clock, '24' for 24-hour clock.
 * @returns {string} The formatted date string, or "Unknown".
 */
export const formatDateTime = (timestamp, timeZone = 'local', hourFormat = '12') => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp * 1000);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: hourFormat === '12'
    };
    if (timeZone !== 'local') {
        options.timeZone = timeZone;
    }
    return date.toLocaleString(undefined, options);
};

/**
 * Calculates a "time ago" string from a UNIX timestamp.
 * @param {number} timestamp - The UNIX timestamp (in seconds).
 * @returns {string} A relative time string (e.g., "(5 minutes ago)").
 */
export const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    if (seconds < 10) return "(just now)";

    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    let counter;

    if (seconds >= intervals.year) {
        counter = Math.floor(seconds / intervals.year);
        return `(${counter} year${counter > 1 ? 's' : ''} ago)`;
    }
    for (const unit in intervals) {
        counter = Math.floor(seconds / intervals[unit]);
        if (counter > 0) return `(${counter} ${unit}${counter !== 1 ? 's' : ''} ago)`;
    }
    return `(${Math.floor(seconds)} second${Math.floor(seconds) !== 1 ? 's' : ''} ago)`;
};

/**
 * Extracts the join date (as a UNIX timestamp) from a player UID.
 * @param {string} uid - The 24-character player UID.
 * @returns {number} The join date timestamp.
 */
export const getJoinDateFromUID = (uid) => parseInt(uid.substring(0, 8), 16);

/**
 * Extracts a 24-character UID from a string using a regex.
 * @param {string} input - The string to search within.
 * @returns {string|null} The found UID or null.
 */
export const extractUID = (input) => (input.match(/[a-f0-9]{24}/i) || [null])[0];