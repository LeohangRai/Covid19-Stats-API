const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* promise consumption */
getCovidStats("Nepal")
    .then((stats) => {
        console.log(stats);
    })
    .catch((err) => {
        console.log(err.message);
    });

/**
 * getCovidStats:
 * get a Promise object resolved with Covid-19 statistics object (confirmed cases, deaths and recovered cases) of different countries.
 * In case there are physical/system/network errors or in case the user input is invalid, the promise object is rejected with an Error Object.
 * @param {string} country
 * @returns {Promise<object>} covidStatPromise
 */
function getCovidStats(country) {
    const covidStatPromise = new Promise((resolve, reject) => {
        if (!country || typeof country != "string") {
            reject(new Error("Invalid Input"));
        }
        const capitalized = capitalize(country);
        const countryNameEncoded = encodeURIComponent(capitalized);

        fetch(
            `https://covid19-api.weedmark.systems/api/v1/stats?country=${countryNameEncoded}`
        )
            .then((response) => {
                return response.json();
            })
            .then((responseBody) => {
                const errMsg =
                    "Country not found. Returning all stats. Please use a country name found in the data property.";

                // error handling for bad response, when the user Input is wrong/bad
                if (responseBody.message === errMsg) {
                    reject(
                        new Error(
                            "Country not found. Please make sure you spelled the name of the country correctly."
                        )
                    );
                }

                // no error
                resolve(getStats(responseBody));
            })

            .catch((err) => {
                // error handling for physical/system errors. Eg: internet failure
                if (err.type === "system") {
                    reject(
                        new Error(
                            "Cannot connect to the service. Make sure you're connected to the internet."
                        )
                    );
                }
                reject(new Error(err.message));
            });
    });

    return covidStatPromise;
}

/**
 * capitalize
 * : capitalizes the first letter of each word in a given string sentence/phrase
 * @param {string} phrase
 * @returns {string} Capitalized String
 */
function capitalize(phrase) {
    return phrase.replace(
        /\b([a-zÁ-ú]{3,})/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1)
    );
}

/**
 * getStats
 * : extracts covid stats from the api response body provided
 * @param {object} responseBody
 * @returns {{lastChecked: string, confirmed: number, deaths: number, recovered: number}} Covid stats Object
 */
function getStats(responseBody) {
    // holds the date of the last checked date of the covid stats
    const lastChecked = responseBody.data.lastChecked;
    // an array containing the covid stats for different provinces of the given country
    const covidStats = responseBody.data.covid19Stats;

    // in case the country has multiple provinces, the covidStats array will contain objects for different provinces, so we have to sum them up.
    if (covidStats.length > 1) {
        const country = covidStats[0].country;
        let confirmed = 0;
        let deaths = 0;
        let recovered = 0;
        covidStats.forEach((provinceData) => {
            // Checking the data type of the stat data (confimred, deaths and recovered) because some of them had NaN value, which we must avoid adding.
            if (typeof provinceData.confirmed === "number") {
                confirmed += provinceData.confirmed;
            }
            if (typeof provinceData.deaths === "number") {
                deaths += provinceData.deaths;
            }
            if (typeof provinceData.recovered === "number") {
                recovered += provinceData.recovered;
            }
        });
        return { country, lastChecked, confirmed, deaths, recovered };
    }

    // if the country does not have multiple provinces
    return {
        country: covidStats[0].country,
        lastChecked,
        confirmed: covidStats[0].confirmed,
        deaths: covidStats[0].deaths,
        recovered: covidStats[0].recovered,
    };
}
