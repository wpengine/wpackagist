// function to check empty-ish strings and return undefined if empty-ish
function check_empty_string(str) {
    if (!str || str === '' || str.match(/undefined|null/)) return undefined;
    else return str
}

// function to set a cookie in the user's browser
function set_cookie(name, value, duration_in_days, path = '/', host = '.wpackagist.org') {
    let expires = '';

    if (duration_in_days) {
        const date = new Date();
        date.setTime(date.getTime() + (duration_in_days * 24 * 60 * 60 * 1000)); // Convert days to milliseconds
        expires = '; expires=' + date.toUTCString();
    }

    const cookie_string = encodeURIComponent(value) + expires + '; path=' + path + '; domain=' + host;
    document.cookie = name + '=' + cookie_string;
}

// function to get all browser cookies as an object
function get_all_cookies() {
    const cookies = {};
    const cookie_string = document.cookie;

    if (cookie_string) {
        const cookie_pairs = cookie_string.split('; ');
        for (const pair of cookie_pairs) {
            const [name, value] = pair.split('=');
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
        }
    }

    return cookies;
}

// function to get cookie with specified name from cookies object
function get_cookie(name, cookies) {
    cookies = cookies || get_all_cookies()
    return cookies[name]
}

// --- SEGMENT MIDDLEWARES --- //

// function to extract specified cookies and transform the values
function extract_traits_from_cookies(cookies) {
    const configurations = [{
        trait: 'ga_client_id',
        cookie: '_ga',
        transform: function(value) {
            let extracted = /^[GA\d\.]+\.(\d+\.\d+)/.exec(value) || undefined
            if (extracted) extracted = extracted[1]
            return extracted
        }
    },
        {
            trait: 'ga_session_id',
            cookie: '_ga_QQ5FN8NX8W',
            transform: function(value) {
                let extracted = /^[GS\d\.]+\.s(\d+)\$/.exec(value) || undefined
                if (extracted) extracted = extracted[1]
                return extracted
            }
        },
        {
            cookie: '_fbp',
            trait: 'fbp'
        },
        {
            cookie: '_fbc',
            trait: 'fbc'
        },
        {
            cookie: 'kameleoonVisitorCode',
            trait: 'kameleoonVisitorCode'
        },
        {
            cookie: 'hubspotutk',
            trait: 'hubspotutk'
        },
        {
            cookie: '_hstc',
            trait: 'hstc'
        },
        {
            cookie: '_hssc',
            trait: 'hssc'
        },
        {
            cookie: '_hssrc',
            trait: 'hssrc'
        },
        {
            cookie: 'uetvid',
            trait: 'uetvid'
        },
        {
            cookie: 'uetsid',
            trait: 'uetsid'
        },
        {
            cookie: 'fbclid',
            trait: 'fbclid'
        },
        {
            cookie: 'gclid',
            trait: 'gclid'
        },
        {
            cookie: 'msclkid',
            trait: 'msclkid'
        },
        {
            cookie: 'li_fat_id',
            trait: 'li_fat_id'
        },
    ];

    cookies = cookies || get_all_cookies();
    const extracted = {};

    for (const configuration of configurations) {
        var value = get_cookie(configuration.cookie, cookies)
        if (value && configuration?.transform) {
            try {
                value = configuration.transform(value)
            } catch (error) {
                console.log(error)
            }
        }
        extracted[configuration?.trait] = value
    }

    return extracted;
}

// function to add context traits to every segment event
function add_traits_context_to_event(event, cookies) {
    cookies = cookies || get_all_cookies()
    let traits = window.analytics.user()?.traits()
    if (!traits) traits = JSON.parse(localStorage.getItem('ajs_user_traits') || '{}')
    event.context.traits = {
        ...traits,
        ...extract_traits_from_cookies(cookies)
    }
    return event
}

// function to add "active" (logged in) context to every event
function add_active_context_to_event(event, cookies) {
    const active = undefined // update with logic to check if user is logged in
    event.context.active = active
    return event
}


// function to add screen context to every event
function add_screen_context_to_event(event) {
    event.context.screen = {
        width: window.screen.availWidth,
        height: window.screen.availHeight,
        density: window.devicePixelRatio,
        depth: window.screen.colorDepth,
        orientation: window.screen.orientation.type,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            visible: document.hidden === false,
        },
    }

    return event
}

// function to add device context to every event
function add_device_context_to_event(event) {
    function get_device_details() {
        const ua = window.navigator.userAgent.toLowerCase()
        let browser = "Unknown";
        let browser_version = "Unknown";
        let os = "Unknown";
        let os_version = "Unknown";

        // Browser detection
        if (ua.includes("firefox")) {
            browser = "Firefox";
            browser_version = ua.match(/firefox\/([\d.]+)/)?.[1] || "Unknown";
        } else if (ua.includes("chrome") && !ua.includes("edg/")) {
            browser = "Chrome";
            browser_version = ua.match(/chrome\/([\d.]+)/)?.[1] || "Unknown";
        } else if (ua.includes("safari") && !ua.includes("chrome")) {
            browser = "Safari";
            browser_version = ua.match(/version\/([\d.]+)/)?.[1] || "Unknown";
        } else if (ua.includes("edg/")) {
            browser = "Edge";
            browser_version = ua.match(/edg\/([\d.]+)/)?.[1] || "Unknown";
        } else if (ua.includes("opr/") || ua.includes("opera")) {
            browser = "Opera";
            browser_version = (ua.match(/(?:opr|opera)\/([\d.]+)/)?.[1]) || "Unknown";
        } else if (ua.includes("trident") || ua.includes("msie")) {
            browser = "Internet Explorer";
            browser_version = (ua.match(/(?:msie |rv:)([\d.]+)/)?.[1]) || "Unknown";
        }

        // OS detection
        if (ua.includes("win")) {
            os = "Windows";
            if (ua.includes("windows nt 10.0")) os_version = "10";
            else if (ua.includes("windows nt 6.3")) os_version = "8.1";
            else if (ua.includes("windows nt 6.2")) os_version = "8";
            else if (ua.includes("windows nt 6.1")) os_version = "7";
            else os_version = "Unknown";
        } else if (ua.includes("mac")) {
            os = "macOS";
            os_version = ua.match(/mac os x ([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "Unknown";
        } else if (ua.includes("android")) {
            os = "Android";
            os_version = ua.match(/android ([\d.]+)/)?.[1] || "Unknown";
        } else if (ua.includes("linux")) {
            os = "Linux";
        } else if (ua.includes("ios")) {
            os = "iOS";
            os_version = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "Unknown";
        }

        return {
            'browser': {
                'name': browser,
                'version': browser_version
            },
            'os': {
                'name': os,
                'version': os_version
            },
        };
    }

    const device = get_device_details()
    event.context.browser = device.browser
    event.context.os = device.os
    return event
}

// --- SEGMENT INITIALIZATION --- //
// dev write key: LJtH5KB9NekHD4NI9nTTP7RFdP9qBz4k
// prod write key: JE0JDr66vnWajTou1WbihYddU4FKMTU0
const segment_key = (window.location.host === 'wpackagist.org') ? 'JE0JDr66vnWajTou1WbihYddU4FKMTU0' : (window.location.host == 'staging.wpackagist.org' ? 'LJtH5KB9NekHD4NI9nTTP7RFdP9qBz4k' : null);
if (segment_key !== null) {
    var analytics = window.analytics = window.analytics || [];
    if (!analytics.initialize) {
        if (analytics.invoked) {
            window.console && console.error && console.error('Segment snippet included twice.');
        } else {
            analytics.invoked = !0;
            analytics.methods = [
                'trackSubmit',
                'trackClick',
                'trackLink',
                'trackForm',
                'pageview',
                'identify',
                'reset',
                'group',
                'track',
                'ready',
                'alias',
                'debug',
                'page',
                'once',
                'off',
                'on',
                'addSourceMiddleware',
                'addIntegrationMiddleware',
                'setAnonymousId',
                'addDestinationMiddleware',
                'timeout'];
            analytics.factory = function(e) {
                return function() {
                    var t = Array.prototype.slice.call(arguments);
                    t.unshift(e);
                    analytics.push(t);
                    return analytics;
                };
            };
            for (var e = 0; e < analytics.methods.length; e++) {
                var key = analytics.methods[e];
                analytics[key] = analytics.factory(key);
            }
            analytics.load = function(key, e) {
                var t = document.createElement('script');
                t.type = 'text/javascript';
                t.async = !0;
                t.src = 'https://journey-cdn.wpengine.com/journey.js/v1/' + key + '/journey.min.js'
                var n = document.getElementsByTagName('script')[0];
                n.parentNode.insertBefore(t, n);
                analytics._loadOptions = e;
            };
            analytics._writeKey = segment_key;
            analytics.SNIPPET_VERSION = '4.15.2';
            analytics.timeout(500);
            analytics._cdn = 'https://journey-cdn.wpengine.com';
        }
    }

    // function to apply above function logic to Segment events
    analytics.addSourceMiddleware(function({payload, integration, next}) {
        let event = payload.obj
        const cookies = get_all_cookies()
        event = add_traits_context_to_event(event, cookies)
        event = add_active_context_to_event(event, cookies)
        event = add_screen_context_to_event(event)
        event = add_device_context_to_event(event)
        payload.obj = event
        next(payload)
    });

    // function to add context and the event id to Google Tag Manager dataLayer pushes
    analytics.addDestinationMiddleware('Google Tag Manager', function({payload, next}) {
        payload.obj.properties.context = payload.obj.context;
        payload.obj.properties.event_id = payload.obj.messageId;
        next(payload);
    });


    /**
     * `analytics.load(...)` and `analytics.page()` are run at the very end of all of the code in this file to ensure
     * that the context is added to every event, including page views, as we may not have fully initialized all
     * middlewares before sending the page view subsequently not including the context data.
     *
     * Segment has 2 stages of "loading":
     * 1. Initialization
     * 2. Loading Dependencies
     *
     * All code that is run before `analytics.load(...)` is initializing Segment (primarily setting the object to the window).
     * After `analytics.load(...)` runs, dependencies are downloaded and all events are queued while everything that was
     * previously initialized is sent to Segment.
     */
    analytics.load(segment_key);
    analytics.page();
}
