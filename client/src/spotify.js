import axios from "axios";

// Map for localStorage keys
const LOCALSTORAGE_KEYS = {
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expireTime: "spotify_token_expire_time",
  timestamp: "spotify_token_timestamp",
};

// Map for lacalStorage values
const LOCALSTORAGE_VALUES = {
  accessToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.accessToken),
  refreshToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.refreshTokensToken),
  expireTime: window.localStorage.getItem(LOCALSTORAGE_KEYS.expireTime),
  timestamp: window.localStorage.getItem(LOCALSTORAGE_KEYS.timestamp),
};

/**
 * Clear out all localStorage items we've set and reload the page
 */
export const logout = () => {
  // Clear all localStorage items
  for (const property in LOCALSTORAGE_KEYS) {
    window.localStorage.removeItem(LOCALSTORAGE_KEYS[property]);
  }
  // Navigate to homepage
  window.location = window.location.origin;
};

/**
 * Use the refresh token in localStorage to hit the /refresh_token endpoint
 * in our Node app, then update values in localStorage with data from response.
 */
const refreshToken = async () => {
  try {
    // logout if there is no refresh token stored
    if (
      !LOCALSTORAGE_VALUES.refreshToken ||
      LOCALSTORAGE_VALUES.refreshToken === "undefined" ||
      Date.now() - Number(LOCALSTORAGE_VALUES.timestamp) / 1000 < 1000
    ) {
      console.error("No refresh token available");
      logout();
    }

    // use '/refresh_token' endpoint from our Node app
    const { data } = await axios.get(`/refresh_token?refresh_token=${LOCALSTORAGE_VALUES.refreshToken}`);
    console.log(data);

    // update localStorage values
    window.localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, data.accessToken);
    window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

    // reload the page for localStorage updates to be reflected
    window.location.reload();
  } catch (error) {
    console.error(error);
  }
};

// Checks if the amount of time that has elapsed between timestamp in localStorage
// and now is greater than the expiration time of 3600 seconds
// return boolean value wether or not the access token in localStorage has expired

const hasTokenExpired = () => {
  const { accessToken, timestamp, expireTime } = LOCALSTORAGE_VALUES;
  if (!accessToken || !timestamp) {
    return false;
  }

  const millisecondsElapsed = Date.now() - Number(timestamp);
  return millisecondsElapsed / 1000 > Number(expireTime);
};

const getAccessToken = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const queryParams = {
    [LOCALSTORAGE_KEYS.accessToken]: urlParams.get("access_token"),
    [LOCALSTORAGE_KEYS.refreshToken]: urlParams.get("refresh_token"),
    [LOCALSTORAGE_KEYS.expireTime]: urlParams.get("expires_in"),
  };
  const hasError = urlParams.get("error");

  // if there is an error OR token in localStorage has expired
  if (hasError || hasTokenExpired() || LOCALSTORAGE_VALUES.accessToken === "undefined") {
    refreshToken();
  }

  // if there is a valid access token in localStorage
  if (LOCALSTORAGE_VALUES.accessToken && LOCALSTORAGE_VALUES.accessToken !== "undefined") {
    return LOCALSTORAGE_VALUES.accessToken;
  }

  // if there is a token in the URL query params, user is logging in for the first time
  if (queryParams[LOCALSTORAGE_KEYS.accessToken]) {
    // store the query params in localStorage
    for (const property in queryParams) {
      window.localStorage.setItem(property, queryParams[property]);
    }
    // set timestamp
    window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());
    // return access token from query params
    return queryParams[LOCALSTORAGE_KEYS.accessToken];
  }

  return false;
};

export const accessToken = getAccessToken();

/**
 * Axios global request headers
 * https://github.com/axios/axios#global-axios-defaults
 */

axios.defaults.baseURL = "https://api.spotify.com/v1";
axios.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
axios.defaults.headers["Content-Type"] = "application/json";

// Get current user's profile

export const getCurrentUserProfile = () => {
  return axios.get("/me");
};

/**
 * Get a List of Current User's Playlists
 * https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-a-list-of-current-users-playlists
 * @returns {Promise}
 */

export const getCurrentUserPlaylists = (limit = 20) => {
  return axios.get(`/me/playlists?limit=${limit}`);
};

/**
 * Get a User's Top Artists and tracks
 * @param {string} time_range - 'short_term' (last 4 weeks) 'medium_term' (last 6 months) or 'long_term' (calculated from several years of data and including all new data as it becomes available). Defaults to 'short_term'
 */

export const getTopArtists = (time_range = "short_term") => {
  return axios.get(`/me/top/artists?time_range=${time_range}`);
};

/**
 * Get a User's Top Tracks
 * same as Top Artists
 */

export const getTopTracks = (time_range = "short_term") => {
  return axios.get(`/me/top/tracks?time_range=${time_range}`);
};
