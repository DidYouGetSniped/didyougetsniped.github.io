// scripts/tracked-uids.js
// ─────────────────────────────────────────────────────────────────────────────
// List every player UID you want the daily workflow to snapshot here.
// The GitHub Action reads this file at 02:00 UTC each night and fetches
// fresh stats for every entry, storing them in historical-stats/{uid}/snapshots.json
//
// Format:  { uid: '24-character-hex-string', label: 'Friendly display name' }
//
// To add a player:
//   1. Uncomment one of the template lines (or copy the pattern).
//   2. Replace the placeholder UID with the real 24-character UID.
//   3. Set a label (used only in Action logs — not shown on the site).
//   4. Commit & push — the next scheduled run will pick it up automatically.
//
// Rate limit note: the API allows 20 requests per minute.
// Each player requires 4 requests (getPlayer + 3 percentile endpoints).
// You can safely track up to ~4 players per minute window; the fetch script
// handles waiting automatically when the limit is reached.
// ─────────────────────────────────────────────────────────────────────────────

export const TRACKED_UIDS = [

    // { uid: 'REPLACE_WITH_REAL_UID_1', label: 'Player One'   },
    // { uid: 'REPLACE_WITH_REAL_UID_2', label: 'Player Two'   },
    // { uid: 'REPLACE_WITH_REAL_UID_3', label: 'Player Three' },
    // { uid: 'REPLACE_WITH_REAL_UID_4', label: 'Player Four'  },
    // { uid: 'REPLACE_WITH_REAL_UID_5', label: 'Player Five'  },

];
