# War Brokers Stats Website

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fdidyougetsniped.github.io)](https://didyougetsniped.github.io)
[![Discord](https://img.shields.io/discord/1014162018992914433?color=7289da&label=Discord&logo=discord)](https://discord.gg/NuST4n4sWt)

A comprehensive statistics and tools website for [War Brokers](https://warbrokers.io), featuring player stats, squad analytics, performance ratings, and more.

🔗 **Live Site**: [didyougetsniped.github.io](https://didyougetsniped.github.io)

## 📊 Features

### Player Statistics
- **Comprehensive Player Profiles**: View detailed stats including K/D ratio, ELO rankings, weapon performance, and more
- **Advanced Search**: Search by player name or UID
- **Weapon & Vehicle Analytics**: Detailed breakdowns with achievement tracking
- **Interactive Charts**: Visualize your performance across different metrics
- **Timezone Support**: View timestamps in your local timezone or any major timezone worldwide

### Broker Performance Rating (BPR)
The **Broker Performance Rating (BPR)** is a revolutionary metric that measures player effectiveness, resilience, and overall game impact. Unlike simple K/D ratios, BPR considers:
- Combat efficiency (damage-weighted K/D)
- ELO rankings (kills and games)
- Game impact and longevity
- Survivability and resilience
- Experience and dedication

BPR is the second iteration of the original DYGS Score, refined through extensive analysis and testing.

[Learn more about BPR](https://didyougetsniped.github.io/bpr)

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

```
├── index.html              # Homepage
├── wbinfo.html            # Player stats page
├── squads.html            # Squad stats page
├── squadcount.html        # Squad count tracker
├── squadinviter.html      # Squad invitation tool
├── player-tracker.html    # Player count tracker
├── bpr.html              # BPR explanation page
├── updates.html          # Changelog
│
├── main.js               # Player stats logic
├── squads.js            # Squad stats logic
├── api.js               # API wrapper with caching
├── ui.js                # UI rendering
├── uiconst.js           # Performance calculations
├── utils.js             # Utility functions
├── weaponlogic.js       # Weapon achievement system
├── vehiclelogic.js      # Vehicle achievement system
├── squaddb.js           # Squad information database
├── progressbar.js       # Progress indicator
├── background.js        # Random background system
│
├── fetch-data.js            # Squad data collection script
├── fetch-player-count.js    # Player count collection script
│
└── .github/workflows/
    ├── refresh-squad-data.yml       # Squad data automation
    └── fetch-player-count.yml       # Player count automation
```

## 🎯 Performance Optimizations

### Caching Strategy
- **60-second TTL**: Repeated lookups within 60s are instant
- **Rate Limit Bypass**: Cached data doesn't count against limits
- **Smart Invalidation**: Auto-cleanup of expired cache entries

### Batch Processing
```javascript
const BATCH_SIZE = 3;           // Process 3 requests at a time
const BATCH_DELAY = 500;        // 500ms between batches
// Result: ~6 requests/min, well under 19/min limit
```

### Data Efficiency
- **Failed Squad Retry**: Prioritizes previously failed fetches
- **Progress Tracking**: Real-time updates during long operations
- **Minimal Requests**: Achieves 5-50% reduction in API calls

## 🎨 Features in Detail

### Interactive Charts
- **Pie & Bar Charts**: Toggle between visualization types
- **Custom Legends**: Click to show/hide data points
- **Sorting Options**: By size or alphabetically
- **Reset Functionality**: Quick return to default view

### Time & Date Handling
- **12 Timezones**: Major zones across all continents
- **Dual Formats**: 12-hour and 24-hour time
- **Relative Times**: "X hours ago" with auto-updates
- **Join Date Extraction**: Calculated from MongoDB ObjectID

### Weapon Statistics
For each weapon tracked:
- Kills, Deaths, Headshots
- Damage dealt & received
- K/D ratio
- Accuracy (zoomed & unzoomed)
- Headshot rate
- Damage per kill/hit
- Shots fired & hit

## 📈 BPR Calculation

The Broker Performance Rating uses a sophisticated formula:

```javascript
Core Performance = √(Factor A · Factor B)

Factor A (Combat Skills):
  √(Combat Efficiency) + Kills ELO Bonus

Factor B (Game Impact & Resilience):
  Avg Damage Impact + Games ELO Bonus + Resilience

Overall BPR = (Core Performance + XP Bonus) × 100
```

[Full BPR Documentation](https://didyougetsniped.github.io/bpr)

## 🤝 Credits & Acknowledgments

### Created By
**Did You Get Sniped? (DYGS)**

### Special Thanks
- **EpicFeathers**: Contributions and support
- **Pomp**: War Brokers API (`wbapi.wbpjs.com`)
- **TheChillTankMain**: Photos and assets
- **War Brokers Community**: Feedback and testing

### Third-Party Libraries
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Moment.js](https://momentjs.com/) - Time/date handling
- [html2canvas](https://html2canvas.hertzen.com/) - Chart export

## 📝 Changelog

See [updates.html](https://didyougetsniped.github.io/updates) for the changelog.

## 🚦 Rate Limiting

**Current Limits**:
- 19 requests per minute (safe under API's 20/min limit)
- Cached requests don't count toward limit
- 60-second cache duration
- Clear error messages with countdown timers

**Best Practices**:
- Use search by name first (single request)
- Avoid rapid consecutive lookups
- Let cache work (wait 60s for repeated lookups)

## 📊 Data Collection

### Squad Data
- **Frequency**: Every 12 hours (automated via GitHub Actions)
- **Coverage**: All active squads
- **Metrics**: Member counts, averages, activity status
- **Storage**: `squad-data.json`

### Player Count
- **Frequency**: Every 30 minutes (automated via GitHub Actions)
- **Storage**: `player-tracker-data.json`
- **Retention**: All historical data preserved

## 🐛 Known Issues & Limitations

1. **API Rate Limits**: Strict 20 requests/minute limit (we use 19 to be safe)
2. **No Backend**: All processing happens client-side
3. **Data Freshness**: Squad data updates every 12 hours
4. **Blacklisted Players**: Some players may be restricted from view
5. **Browser Support**: Requires modern browser with ES6 module support

## 📜 License & Disclaimer

This is a **third-party fan project** and is not affiliated with, endorsed, or sponsored by War Brokers or its developers.

All game data is accessed through the Pomp's War Brokers API. This project is provided as-is for the community.

## 🔗 Links

- **Website**: [didyougetsniped.github.io](https://didyougetsniped.github.io)
- **Discord**: [Join Support Server](https://discord.gg/NuST4n4sWt)
- **YouTube**: [@DidYouGetSniped](https://youtube.com/@DidYouGetSniped)
- **War Brokers**: [warbrokers.io](https://warbrokers.io)
- **War Brokers Wiki**: [war-brokers.fandom.com](https://war-brokers.fandom.com/wiki/War_Brokers_Wiki)

---

**Made with ❤️ for the War Brokers community**
