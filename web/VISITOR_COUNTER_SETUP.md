# Visitor Counter Setup Guide

## Overview

The web demo now includes a real-time unique visitor counter displayed prominently in the promotional banner and About modal.

## Features

✅ **Unique Visitor Tracking** - Tracks visitors based on IP + User Agent  
✅ **Persistent Storage** - Data saved to `data/visitor_stats.json`  
✅ **Real-time Display** - Counter updates on page load  
✅ **Formatted Numbers** - Shows counts with thousand separators (e.g., "1,234")  
✅ **Multiple Display Locations** - Banner and About modal  
✅ **Privacy-Friendly** - No personal data stored  

## How It Works

### 1. Server-Side Tracking (`server.js`)

```javascript
// Visitor tracking on page load
app.get('/', (req, res) => {
  trackVisitor(req);  // Track before serving page
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for stats
app.get('/api/stats/visitors', (req, res) => {
  res.json({
    success: true,
    data: {
      uniqueVisitors: visitorStats.uniqueVisitors,
      totalVisits: visitorStats.totalVisits
    }
  });
});
```

### 2. Client-Side Display (`app.js`)

```javascript
// Load stats on page load
async function loadVisitorStats() {
  const result = await window.statsAPI.getVisitorStats();
  if (result.success) {
    const count = result.data.uniqueVisitors;
    document.getElementById('visitorCount').textContent = count.toLocaleString();
  }
}
```

### 3. Data Structure

**File**: `data/visitor_stats.json`

```json
{
  "uniqueVisitors": 1234,
  "totalVisits": 5678,
  "visitors": [
    "192.168.1.1_Mozilla/5.0...",
    "10.0.0.1_Chrome/120.0..."
  ]
}
```

## Display Locations

### 1. Promotional Banner (Top)
```html
<span class="visitor-counter">
  👥 <span id="visitorCount">Loading...</span> unique visitors
</span>
```

### 2. About Modal (Footer)
```html
<p class="stats-text">
  👥 <span id="aboutVisitorCount">---</span> unique visitors have tried this demo
</p>
```

## Styling

```css
.visitor-counter {
  background: rgba(255,255,255,0.15);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.2);
}
```

## API Endpoints

### GET `/api/stats/visitors`

**Response:**
```json
{
  "success": true,
  "data": {
    "uniqueVisitors": 1234,
    "totalVisits": 5678
  }
}
```

## Privacy & Security

### What We Track
- IP address (hashed with User Agent)
- User Agent string
- Visit timestamp (implicit)

### What We DON'T Track
- Personal information
- Browsing behavior
- Cookies or session data
- Geographic location
- Device fingerprints

### Data Retention
- Visitor IDs stored indefinitely
- Can be reset by deleting `data/visitor_stats.json`
- No automatic cleanup (by design for accurate counts)

## Testing

### Local Testing

1. Start the server:
```bash
cd web
npm start
```

2. Open http://localhost:3000

3. Check the visitor counter in the banner

4. Verify data file created:
```bash
cat data/visitor_stats.json
```

### Testing Unique Visitors

To test unique visitor detection:

1. Visit from different browsers (Chrome, Firefox, Safari)
2. Visit from different devices (desktop, mobile)
3. Visit from different networks (home, mobile data, VPN)
4. Each should increment the unique visitor count

### Resetting Counter

To reset the counter for testing:

```bash
rm web/data/visitor_stats.json
# Restart server
```

## Deployment Notes

### Railway/Heroku
- Data persists in the container filesystem
- **Warning**: Counter resets on container restart
- For production, consider using a database (Redis, PostgreSQL)

### Production Recommendations

For a production deployment with persistent stats:

1. **Use Redis** for fast, persistent storage:
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function trackVisitor(req) {
  const visitorId = getVisitorId(req);
  await client.sAdd('visitors', visitorId);
  await client.incr('totalVisits');
  const uniqueCount = await client.sCard('visitors');
  return uniqueCount;
}
```

2. **Use PostgreSQL** for permanent storage:
```sql
CREATE TABLE visitors (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) UNIQUE,
  first_visit TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stats (
  key VARCHAR(50) PRIMARY KEY,
  value INTEGER
);
```

3. **Use MongoDB** for flexible storage:
```javascript
const Visitor = mongoose.model('Visitor', {
  visitorId: { type: String, unique: true },
  firstVisit: { type: Date, default: Date.now }
});
```

## Troubleshooting

### Counter Shows "Loading..."
- Check browser console for errors
- Verify API endpoint is accessible: `/api/stats/visitors`
- Check server logs for errors

### Counter Shows "---"
- API request failed
- Check network tab in browser DevTools
- Verify server is running

### Counter Not Incrementing
- Check if visitor ID is being generated correctly
- Verify `trackVisitor()` is called on page load
- Check `data/visitor_stats.json` file permissions

### Counter Resets on Restart
- Normal behavior with file-based storage
- Consider using a database for production
- Ensure `data/` directory is writable

## Future Enhancements

Potential improvements:

- [ ] Add daily/weekly/monthly visitor charts
- [ ] Track page views per visitor
- [ ] Add geographic distribution map
- [ ] Show real-time active users
- [ ] Add visitor session duration
- [ ] Export stats to CSV/JSON
- [ ] Admin dashboard for analytics
- [ ] Integration with Google Analytics
- [ ] A/B testing capabilities
- [ ] Conversion tracking (GitHub clicks, downloads)

## Support

For issues or questions:
- Email: tomtomtongtong@gmail.com
- GitHub Issues: https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5/issues
