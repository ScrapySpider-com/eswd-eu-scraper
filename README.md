## ESWD Severe Weather Events Scraper

Extracts real-time severe weather event reports from the European Severe Weather Database (ESWD) — no account required — and returns structured JSON with event type, location, date, coordinates, and source attribution.

---

## Key Highlights

- **No account or cookies needed** — scrapes the public ESWD database directly via API
- **User-friendly filters** — select time range, event type (hail, wind, tornado, lightning, rain), and country
- **Precise location data** — latitude, longitude, accuracy radius, city, and country for every event
- **Structured output** — clean JSON with ISO dates, coordinate pairs, and source attribution
- **Supports all ESWD event types**: large hail, severe wind, damaging lightning, tornado, heavy rain
- **Advanced override** — supply a raw base64 payload for custom filter configurations

---

### What data does it extract?

Each result contains:

**Event info:** `weather` (formatted label), `eventTypeRaw` (HAIL/WIND/LIGHTNING/TORNADO/PRECIP), `eventDate` (YYYY-MM-DD), `eventTime` (HH:MM UTC)

**Location:** `city`, `state`, `country`, `latitude`, `longitude`, `radius` (km accuracy), `location` (full readable string)

**Hail-specific:** `maxHailDiameter` (cm, HAIL events only)

**Source:** `source` (contact and reference attribution from ESWD)

**Raw:** `locationRaw` (HTML-formatted location block as shown on ESWD website)

Output is available as JSON, CSV, or Excel via Apify dataset export.

---

### Use cases

- **Weather monitoring:** Track severe weather events across Europe in near real-time for alerts or dashboards
- **Insurance & risk:** Enrich property risk models with historical severe weather occurrence data by location
- **Research & journalism:** Download structured event records for meteorological analysis or news reporting
- **Emergency management:** Monitor event types and locations for operational awareness and response planning
- **Agriculture:** Identify hail and wind events near specific regions to assess crop damage risk
- **Academic:** Build datasets of European severe weather occurrences for climate research

---

### How to use

1. Click **Try for free** above
2. In the **Input** tab, set your **Time Range Amount** and **Time Range Unit** (e.g., `2` and `Days` for the past 48 hours)
3. Optionally filter by **Event Types** (e.g., select `HAIL` and `TORNADO`) and **Countries** (e.g., `Germany`, `France`)
4. Set **Max Items** to limit results, or leave at `0` for all events
5. Click **Start** — a typical run completes in under 30 seconds
6. Download results as JSON, CSV, or Excel from the **Output** tab

---

### Input parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `timeAmount` | Integer | No | `2` | How many time units to look back. Combined with `timeUnit` (e.g., `2` + `d` = last 2 days). Range: 1-365. |
| `timeUnit` | String | No | `"d"` | Time unit. Options: `h` (hours), `d` (days), `w` (weeks), `m` (months). |
| `eventTypes` | Array | No | `[]` (all) | Event type filter. Options: `HAIL`, `WIND`, `LIGHTNING`, `TORNADO`, `PRECIP`. Leave empty for all. |
| `countries` | Array | No | `[]` (all) | Country name filter as it appears on ESWD (e.g., `"Germany"`, `"France"`). Leave empty for all. |
| `maxItems` | Integer | No | `0` (unlimited) | Maximum events to save. `0` = no limit. |
| `includeDeleted` | Boolean | No | `false` | Include events deleted from the ESWD database. |
| `rawPayload` | String | No | — | Advanced: base64-encoded ESWD payload overriding all other inputs. Leave empty to use fields above. |

---

### Output example

```json
{
  "weather": "large hail",
  "eventTypeRaw": "HAIL",
  "eventDate": "2025-06-12",
  "eventTime": "14:30 UTC",
  "maxHailDiameter": "3.5",
  "city": "Stuttgart",
  "state": "Baden-Wurttemberg",
  "country": "Germany",
  "latitude": "48.78",
  "longitude": "9.18",
  "radius": "3",
  "location": "Stuttgart Germany (48.78 N, 9.18 E) < 3 km (Thursday)14:30 UTC (+/- 30 min.)",
  "locationRaw": "<p>MaxHailDiameter:3.5 cm</p><p class=HAIL><b>Stuttgart</b> Germany (48.78 N, 9.18 E)</p>",
  "source": "based on information from: J. Mueller https://eswd.eu/report/12345"
}
```

---

### Pricing

This Actor is **free to use** — you only pay for Apify platform compute time.

A typical run fetching 2 days of Europe-wide events (100-500 records) costs approximately **$0.01-$0.05** in Apify platform credits.

New Apify accounts receive **$5 in free credits** — enough for hundreds of runs.

---

### Technical notes

- **No authentication required:** ESWD events are publicly accessible — no login or API key needed
- **API-based:** The scraper calls ESWD internal data API directly — fast and reliable
- **Endpoint stability:** The ESWD API endpoint may change if the site is rebuilt. If results stop returning, please report it.
- **Time accuracy:** Event times carry a +/- 30 minute margin as reported by ESWD
- **Location accuracy:** The `radius` field reflects ESWD place accuracy (typically 1-25 km)
- **Countries format:** Use two-letter ISO codes (e.g., `"DE"`, `"FR"`, `"IT"`)
- **Empty results:** If no events match your filters, try widening the time range or removing filters

---

### Integrations

Output datasets work with any tool that accepts JSON or CSV:

- **REST API:** Trigger runs and retrieve data programmatically via the Apify API
- **Make (Integromat):** Use the Apify Make module to send event data to any connected app
- **Zapier:** Connect Actor runs to 5,000+ apps via the Apify Zapier integration
- **n8n:** Automate weather event pipelines with the Apify n8n node
- **Excel / Google Sheets:** Export dataset directly as CSV and import

---

### Support

Have questions or found a bug? Reach out:

- **Email:** ScrapySpider@protonmail.com
- **Website:** [ScrapySpider.com](https://ScrapySpider.com)
- **Apify:** Open a support issue on this Actor page
- **Response time:** Within 24-48 hours on weekdays
