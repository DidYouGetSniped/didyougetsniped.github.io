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
    });
};

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

export const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    if (seconds < 10) return "(just now)";

    const YEAR_IN_SECONDS = 31557600;
    const DAY_IN_SECONDS = 86400;

    const years = Math.floor(seconds / YEAR_IN_SECONDS);

    if (years > 0) {
        const remainingSeconds = seconds - (years * YEAR_IN_SECONDS);
        const days = Math.floor(remainingSeconds / DAY_IN_SECONDS);
        const yearText = `${years} year${years > 1 ? 's' : ''}`;

        if (days > 0) {
            const dayText = `${days} day${days > 1 ? 's' : ''}`;
            return `(${yearText} and ${dayText} ago)`;
        } else {
            return `(${yearText} ago)`;
        }
    }

    const intervals = { month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    let counter;
    for (const unit in intervals) {
        counter = Math.floor(seconds / intervals[unit]);
        if (counter > 0) {
            return `(${counter} ${unit}${counter !== 1 ? 's' : ''} ago)`;
        }
    }

    return `(${Math.floor(seconds)} second${Math.floor(seconds) !== 1 ? 's' : ''} ago)`;
};


export const getJoinDateFromUID = (uid) => parseInt(uid.substring(0, 8), 16);

export const extractUID = (input) => (input.match(/[a-f0-9]{24}/i) || [null])[0];