import { Actor } from "apify";
import { Dataset, gotScraping, log } from "crawlee";

await Actor.init();

const {
    timeAmount = 2,
    timeUnit = "d",
    eventTypes = [],
    countries = [],
    maxItems = 0,
    includeDeleted = false,
    rawPayload = null,
} = (await Actor.getInput()) || {};

// Build base64-encoded payload from user-friendly inputs, or use raw override
function buildPayload(amount, unit, types, countryList, deleted) {
    const arr = [
        { startCoordinates: 1, endCoordinates: 2, time: 3, qualityLevels: 6, eventTypes: 7, countries: 8, advancedFilters: 9, includeDeleted: 10 },
        { latitude: -1, longitude: -1 },
        { latitude: -1, longitude: -1 },
        { amount: 4, unit: 5 },
        amount,
        unit,
        [],
        types || [],
        countryList || [],
        [],
        deleted || false,
    ];
    return Buffer.from(JSON.stringify(arr)).toString("base64");
}

const payload = rawPayload || buildPayload(timeAmount, timeUnit, eventTypes, countries, includeDeleted);

log.info(`Fetching events: ${timeAmount}${timeUnit} lookback, types=[${eventTypes.join(",")||"all"}], countries=[${countries.join(",")||"all"}]`);

const data = await gotScraping({
    url: "https://eswd.eu/_app/remote/q5s0im/getEvents",
    method: "POST",
    headers: {
        accept: "*/*",
        "accept-language":
            "en-US,en;q=0.9,hi;q=0.8,gu;q=0.7,zh;q=0.6,zh-HK;q=0.5,zh-TW;q=0.4,zh-CN;q=0.3,am;q=0.2,de;q=0.1",
        "content-type": "application/json",
        origin: "https://eswd.eu",
        priority: "u=1, i",
        referer:
            "https://eswd.eu/en?filter=%7B%22startCoordinates%22%3A%7B%7D%2C%22endCoordinates%22%3A%7B%7D%2C%22time%22%3A%7B%22amount%22%3A2%2C%22unit%22%3A%22d%22%7D%2C%22qualityLevels%22%3A%5B%5D%2C%22countries%22%3A%5B%5D%2C%22advancedFilters%22%3A%5B%5D%2C%22includeDeleted%22%3Afalse%7D",
        "sec-ch-ua":
            '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        Cookie: "PARAGLIDE_LOCALE=en-gb",
    },
    body: JSON.stringify({
        payload,
        refreshes: [],
    }),
});

// Parse the string response to JSON
let rawData;
try {
    rawData = JSON.parse(
        (typeof data.body === "string" ? JSON.parse(data.body) : data.body)
            .result
    );
} catch (error) {
    log.error("Failed to parse response", { error: error.message });
    rawData = [];
}

// Parse the complex nested array structure
function parseESWDData(rawData) {
    if (!rawData || !Array.isArray(rawData) || rawData.length < 3) {
        return [];
    }

    const [version, recordIndices, ...dataItems] = rawData;

    if (!Array.isArray(recordIndices) || recordIndices.length === 0) {
        return [];
    }

    // Helper function to format event type
    function formatEventType(type) {
        switch (type) {
            case "HAIL":
                return "large hail";
            case "WIND":
                return "severe wind";
            case "LIGHTNING":
                return "damaging lightning";
            case "TORNADO":
                return "tornado";
            case "PRECIP":
                return "heavy rain";
            default:
                return type?.toLowerCase() || "";
        }
    }

    // Helper function to format date
    function formatDate(dateArray) {
        if (!Array.isArray(dateArray) || dateArray.length < 2) return "";
        const date = new Date(dateArray[1]);
        return date
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                weekday: "long",
            })
            .replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$1-$2-$3");
    }

    // Helper function to format time
    function formatTime(dateArray) {
        if (!Array.isArray(dateArray) || dateArray.length < 2) return "";
        const date = new Date(dateArray[1]);
        return date.toTimeString().slice(0, 5) + " UTC";
    }

    // Helper to extract ISO date
    function toISODate(dateArray) {
        if (!Array.isArray(dateArray) || dateArray.length < 2) return "";
        return new Date(dateArray[1]).toISOString().slice(0, 10);
    }

    // Helper to extract HH:MM UTC time
    function toTimeUTC(dateArray) {
        if (!Array.isArray(dateArray) || dateArray.length < 2) return "";
        return new Date(dateArray[1]).toISOString().slice(11, 16) + " UTC";
    }

    const results = [];

    // Process each record
    for (let i = 0; i < recordIndices.length; i++) {
        const startIndex = recordIndices[i];

        // Get the column mapping for this record (always the first item after startIndex)
        const columnMap = rawData[startIndex];
        if (!columnMap || typeof columnMap !== "object") {
            continue;
        }

        // Helper function to get value by column name for this record
        function getValue(columnName) {
            const columnIndex = columnMap[columnName];
            if (columnIndex === undefined || columnIndex >= rawData.length)
                return null;
            return rawData[columnIndex];
        }

        // Extract the data for this event
        const latitude = getValue("LATITUDE");
        const longitude = getValue("LONGITUDE");
        const country = getValue("COUNTRY");
        const place = getValue("PLACE");
        const eventType = getValue("TYPE_EVENT");
        const timeEvent = getValue("TIME_EVENT");
        const contact = getValue("CONTACT");
        const reference = getValue("REFERENCE");
        const placeAccuracy = getValue("PLACE_ACCURACY");
        const state = getValue("STATE");
        const maxHailDiameter = getValue("MAX_HAIL_DIAMETER");

        // Skip if essential data is missing
        if (!latitude || !longitude || !eventType) continue;

        // Handle missing place names by creating a descriptive city field
        let cityName = "";
        if (place && place !== "null" && place.trim() !== "") {
            cityName = place;
        } else {
            // For records without specific place names, create a descriptive location
            // Using the coordinates to create something like "Location 48.95°N, 20.71°E"
            cityName = `Location ${parseFloat(latitude).toFixed(
                2
            )}°N, ${parseFloat(longitude).toFixed(2)}°E`;
        }

        // Extract radius from PLACE_ACCURACY - this appears to be in kilometers
        let radiusKm = "3"; // Default fallback
        if (
            placeAccuracy !== null &&
            placeAccuracy !== undefined &&
            placeAccuracy !== "null"
        ) {
            // PLACE_ACCURACY comes in formats like "1KM", "3KM", etc.
            if (
                typeof placeAccuracy === "string" &&
                placeAccuracy.trim() !== ""
            ) {
                const numMatch = placeAccuracy.match(/(\d+(?:\.\d+)?)/);
                if (numMatch) {
                    radiusKm = numMatch[1]; // Extract just the number part
                }
            } else if (typeof placeAccuracy === "number") {
                radiusKm = placeAccuracy.toString();
            }
        }

        // Use STATE field if available, otherwise empty
        const stateValue =
            state && state !== "null" && state.trim() !== "" ? state : "";

        // Create location string
        const locationParts = [];
        if (cityName) locationParts.push(cityName);
        if (country) locationParts.push(country);
        const locationString = locationParts.join(" ");

        // Create coordinates string
        const coordsString = `(${latitude} N, ${longitude} E)`;

        // Create date string
        const dateString = formatDate(timeEvent);
        const timeString = formatTime(timeEvent);

        // Create location with full details
        const fullLocation = `${locationString} ${coordsString} < ${radiusKm} km${dateString}\n (${dateString
            .split(" ")
            .pop()})${timeString} (+/- 30 min.)`;

        // Create locationRaw (HTML format similar to original)
        const eventClass = eventType?.toUpperCase() || "UNKNOWN";
        const hailDiameterText = maxHailDiameter ? `${maxHailDiameter} cm` : "N/A";
        const locationRaw = `<p>MaxHailDiameter:${hailDiameterText}</p>
        <p class="${eventClass}">
</p>
<p class="${eventClass}">
<b>${cityName || ""}</b>
${country || ""} ${coordsString} &lt; ${radiusKm} km<br><b>${dateString}</b>
 (${dateString.split(" ").pop()})<br><b>${
            timeString.split(" ")[0]
        }</b> UTC (+/- 30 min.)<br></p>`;

        const result = {
            weather: formatEventType(eventType),
            eventTypeRaw: eventType || "",
            eventDate: toISODate(timeEvent),
            eventTime: toTimeUTC(timeEvent),
            maxHailDiameter: maxHailDiameter !== null && maxHailDiameter !== undefined ? String(maxHailDiameter) : "",
            location: fullLocation,
            locationRaw: locationRaw,
            city: cityName || "",
            state: stateValue,
            country: country || "",
            latitude: latitude?.toString() || "",
            longitude: longitude?.toString() || "",
            radius: radiusKm,
            source: `based on information from: ${contact || ""} ${
                reference || ""
            }`.trim(),
        };

        results.push(result);
    }

    return results;
}

const transformedData = parseESWDData(rawData);

const finalData = (maxItems > 0) ? transformedData.slice(0, maxItems) : transformedData;

log.info(`Parsed ${transformedData.length} events. Saving ${finalData.length} to dataset.`);

if (finalData.length > 0) {
    await Dataset.pushData(finalData);
} else {
    log.warning("No events found for the given search parameters.");
}
await Actor.exit();
