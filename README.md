# Did You Get Sniped?'s War Brokers Tools

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fdidyougetsniped.github.io)](https://didyougetsniped.github.io)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-7289da?logo=discord&logoColor=white)](https://discord.gg/NuST4n4sWt)

A comprehensive website for [War Brokers](https://warbrokers.io), featuring player stats, squad analytics, performance ratings, and more.

🔗 **Live Site**: [didyougetsniped.github.io](https://didyougetsniped.github.io)

## 📊 Features

### Player Statistics
- **Comprehensive Player Profiles**: View detailed stats including K/D ratio, ELO rankings, weapon performance, and more
- **Advanced Search**: Search by player name or UID
- **Weapon & Vehicle Analytics**: Detailed breakdowns with achievement tracking
- **Interactive Charts**: Visualize your performance across different metrics
- **Timezone Support**: View timestamps in your local timezone or any major timezone worldwide

### Squad Tools
- **Squad Stats**: View comprehensive squad-wide statistics
- **Member Analysis**: Track average levels, ELO ratings, and activity
- **Squad Browser**: Browse all squads with sorting and filtering
- **Squad Count Tracker**: Monitor squad sizes and activity levels
- **Squad Inviter**: Streamlined tool for inviting players to your squad

### Player Count Tracker
- **Real-time Monitoring**: Track online player counts over time
- **Historical Data**: View trends with customizable time ranges
- **Interactive Charts**: Visualize player activity patterns
- **Export Functionality**: Export data as CSV or PNG

### Broker Performance Rating (BPR)
The **Broker Performance Rating (BPR)** is a revolutionary metric that measures player effectiveness, resilience, and overall game impact. Unlike simple K/D ratios, BPR considers:
- Combat efficiency (damage-weighted K/D)
- ELO rankings (kills and games)
- Game impact and longevity
- Survivability and resilience
- Experience and dedication

BPR is the second iteration of the original DYGS Score, refined through extensive analysis and testing.

[Learn more about BPR](https://files.catbox.moe/oqwzj1.pdf)

## 🛠️ Technical Stack

### Frontend
- **Vanilla JavaScript**: No frameworks, pure performance
- **ES6 Modules**: Clean, modular code architecture
- **Chart.js**: Interactive data visualizations
- **CSS3**: Modern styling with custom properties

### Data & APIs
- **War Brokers API**: Powered by Pomp's API (`wbapi.wbpjs.com`)
- **Rate Limiting**: Smart 19 requests/minute with intelligent caching
- **Caching System**: 60-second cache to reduce API load
- **Batch Processing**: Efficient data fetching for squads

### Automation
- **GitHub Actions**: Automated data collection every 12/30 minutes
- **JSON Data Storage**: Fast, cached squad and player count data

## 🚀 Key Technologies

### Rate Limiting & Performance
```javascript
// Intelligent rate limiting with caching
const RATE_LIMIT_CONFIG = {
    maxRequests: 19,        // Safe under 20/min limit
    timeWindow: 60 * 1000,  // 60 seconds
    cacheTTL: 60 * 1000     // Cache for 60 seconds
};
```

- **Smart Caching**: Cached requests don't count against rate limits
- **Batch Processing**: Squads processed in batches to prevent rate limit errors
- **Cross-tab Sync**: Rate limits synchronized across browser tabs

### Achievement System
Custom achievement tracking for:
- **43+ Weapons**: Bronze, Silver, and Gold tiers
- **13 Vehicles**: Fins, tanks, helicopters, and more
- Dynamic thresholds based on weapon/vehicle usage patterns

### Advanced Statistics
- **Performance Metrics**: BPR, K/D milestones, accuracy tracking
- **Damage Analytics**: Damage dealt/received per weapon
- **Game Mode Stats**: Wins/losses across all modes
- **Comprehensive Calculations**: 30+ derived statistics

## 📁 Project Structure

```text
|-- index.html                     # Homepage
|-- wbinfo.html                    # Player stats page
|-- squads.html                    # Squad stats page
|-- squadcount.html                # Squad count tracker
|-- squadinviter.html              # Squad invitation tool
|-- player-tracker.html            # Player count tracker
|-- updates.html                   # Changelog
|-- warbrokers_mapper.html         # Mapper page
|
|-- main.js                        # Player stats logic
|-- squads.js                      # Squad stats logic
|-- api.js                         # API wrapper with caching
|-- ui.js                          # UI rendering
|-- uiconst.js                     # Performance calculations
|-- utils.js                       # Utility functions
|-- custom-stats.js                # Custom stats utilities
|-- history.js                     # Historical stats logic
|-- mapper.js                      # Mapper logic
|-- weaponlogic.js                 # Weapon achievement system
|-- vehiclelogic.js                # Vehicle achievement system
|-- squaddb.js                     # Squad information database
|-- progressbar.js                 # Progress indicator
|-- background.js                  # Random background system
|
|-- style.css                      # Global styles
|-- homepage.css                   # Homepage styles
|-- squad.css                      # Squad page styles
|-- squadcount.css                 # Squad count styles
|-- playercounttracker.css         # Player tracker styles
|-- mapper.css                     # Mapper styles
|-- updates.css                    # Updates page styles
|
|-- fetch-data.js                  # Squad data collection script
|-- fetch-player-count.js          # Player count collection script
|-- scripts/
|   |-- fetch-stats.js             # Tracked player stats collector
|   `-- tracked-uids.js            # UIDs for tracked player stats
|
|-- squad-data.json                # Cached squad data
|-- squadwars.json                 # Squad war data
|-- playercountinfo/
|   `-- player-tracker-data/       # Monthly player count archives
|-- historical-stats/
|   `-- <uid>/snapshots.json       # Per-player historical snapshots
|
`-- .github/workflows/
    |-- refresh-squad-data.yml     # Squad data automation
    |-- track-players.yml          # Player count automation
    `-- fetch-stats.yml            # Tracked stats automation
```

## 🎯 Performance Optimizations

### Caching Strategy and Data Efficiency
- **60-second TTL**: Repeated lookups within 60s are instant
- **Rate Limit Bypass**: Cached data doesn't count against limits
- **Smart Invalidation**: Auto-cleanup of expired cache entries
- **Failed Squad Retry**: Prioritizes previously failed fetches
- **Progress Tracking**: Real-time updates during long operations
- **Minimal Requests**: Achieves 5-50% reduction in API calls

## 🚦 Rate Limiting

**Current Limits**:
- 19 requests per minute (safe under API's 20/min limit)
- Cached requests don't count toward limit
- 60-second cache duration
- Clear error messages with countdown timers

## 📊 Data Collection

### Squad Data
- **Frequency**: Every 12 hours (automated via GitHub Actions)
- **Coverage**: All active squads
- **Metrics**: Member counts, averages, activity status
- **Storage**: `squad-data.json`

### Player Count
- **Frequency**: Every 30 minutes (automated via GitHub Actions)
- **Storage**: `playercountinfo/player-tracker-data/YYYY-MM.json`
- **Retention**: All historical data preserved

## 🤝 Credits & Acknowledgments

### Created By
**Did You Get Sniped? (DYGS)**

### Special Thanks
- **EpicFeathers**: Contributions and support
- **Pomp**: War Brokers API (`wbapi.wbpjs.com`)
- **TheChillTankMain**: Photos and assets
- **War Brokers Community**: Feedback and testing
- **[OpenAI Codex](https://openai.com/codex/)**: Making coding much faster

### Third-Party Libraries
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Moment.js](https://momentjs.com/) - Time/date handling
- [html2canvas](https://html2canvas.hertzen.com/) - Chart export

## 📝 Changelog

See [updates.html](https://didyougetsniped.github.io/updates) for the changelog.

## 📜 License & Disclaimer

This is a **third-party fan project** and is not affiliated with, endorsed, or sponsored by War Brokers or its developers.

All game data is accessed through Pomp's War Brokers API. This project is provided as-is for the community.

## 🔗 Links

- **Website**: [didyougetsniped.github.io](https://didyougetsniped.github.io)
- **Discord**: [Join Support Server](https://discord.gg/NuST4n4sWt)
- **YouTube**: [@DidYouGetSniped](https://youtube.com/@DidYouGetSniped)
- **War Brokers**: [warbrokers.io](https://warbrokers.io)
- **War Brokers Wiki**: [war-brokers.fandom.com](https://war-brokers.fandom.com/wiki/War_Brokers_Wiki)

---

**Made with ❤️ for the War Brokers community**
