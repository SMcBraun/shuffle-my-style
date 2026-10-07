/*
  PLAIN ENGLISH: This file talks to The Color API, a free website that knows facts about colors.
         It asks for a color's NAME ("Bittersweet") and for a color MIX (colors that go well together).
  LOGIC: fetch() sends a question (a web address) to The Color API and waits for the answer (JSON).
         async/await lets the code wait for the answer without freezing the page.
  WHY WE NEED IT: Card "Connect the color API." The proposal promised the app would name colors and
         suggest creative color mixes. This is one of the project's two required third-party APIs.
  LEARNING GAP: This file ONLY talks to the API. It doesn't build cards or draw anything. That's the
         "API Module" idea from the example proposals: one file for outside data.
         The Color API needs NO key and NO sign-up, so there's nothing secret in this file.
  WHERE THE DATA COMES FROM: https://www.thecolorapi.com, using the colors the user picked
         on the closet page.
*/

/*
  PLAIN ENGLISH: The settings for every question we ask The Color API.
  LOGIC: BASE_URL is the API's home address. MIX_MODE "analogic" means neighbor colors on the
         color wheel. MIX_ASK is how many colors we ASK for. MIX_SHOW is how many we SHOW.
  WHY WE NEED IT: Stored once, so a change happens in ONE place, the same idea as CSS variables.
         We ask for 8 but show only 3, because some answers repeat the top's own color or
         repeat a name. Asking for extra leaves enough good ideas after we skip those.
  LEARNING GAP: Try changing MIX_MODE to "complement" or "triad" later to see different mix styles.
         Those names come straight from the API's own "schemes" list in its answer.
*/
const BASE_URL = "https://www.thecolorapi.com";
const MIX_MODE = "analogic";
const MIX_ASK = 8;
const MIX_SHOW = 3;

/*
  PLAIN ENGLISH: A memory box that remembers answers we already got.
  LOGIC: A Map stores pairs: the question (web address) and its answer (the data).
         Before asking the API, we check the Map first.
  WHY WE NEED IT: One shuffle can ask about the same color many times (the same shoes in 2 outfits).
         Remembering answers makes the page faster and is polite to the free API.
  LEARNING GAP: This memory only lasts until the page reloads. It's not localStorage.
         That's fine here, because color names never change.
*/
const answers = new Map();

/*
  PLAIN ENGLISH: Remove the # from a color code: "#ff6f61" becomes "ff6f61".
  LOGIC: replace() swaps the "#" for nothing ("").
  WHY WE NEED IT: In a web address, # means "jump to a spot on the page," so the browser would
         never send it to the API. You saw this in the address you tested: hex=ff6f61, no #.
  LEARNING GAP: replace() with a plain "#" only removes the FIRST #, which is all a color has.
*/
function cleanHex(hex) {
    return hex.replace("#", "");
}

/*
  PLAIN ENGLISH: Turn a color name into a simple form for comparing: "Screamin' Green" becomes "screamingreen".
  LOGIC: toLowerCase() makes every letter small. replace() with /[^a-z]/g removes anything that
         is NOT a letter from a to z: spaces, apostrophes, dashes. The g means "everywhere," not just once.
  WHY WE NEED IT: Testing showed the API can send "Screamin Green" AND "Screamin' Green." A computer
         sees two different names because of the apostrophe, but a person sees the same name twice.
         Comparing the simple forms catches those look-alike repeats.
  LEARNING GAP: We only COMPARE the simple form. The user still sees the real name, with its
         capital letters and spaces. The /.../ part is a "regular expression," a pattern for finding text.
*/
function simpleName(name) {
    return name.toLowerCase().replace(/[^a-z]/g, "");
}

/*
  PLAIN ENGLISH: Ask The Color API a question and get the answer as JavaScript data.
  LOGIC: 1) If we already have this answer saved in the Map, return it right away.
         2) Otherwise fetch() the address and WAIT (await) for the response.
         3) If the response isn't OK (like a 404 or 500 error), stop with an error.
         4) Turn the JSON text into data with response.json(), save it in the Map, and return it.
  WHY WE NEED IT: Both getColorName and getColorMix use this, so the fetch steps are written once.
  LEARNING GAP: fetch() does NOT treat a 404 or 500 as an error by itself. It only fails if the
         internet is down. That's why we check response.ok ourselves. "throw" stops the function
         and hands the problem to the try/catch in shuffle.mjs.
  WHERE THE DATA COMES FROM: The Color API's answer, the same JSON you saw in your browser.
*/
async function getAnswer(url) {
    if (answers.has(url)) {
        return answers.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`The Color API answered with status ${response.status}`);
    }

    const data = await response.json();
    answers.set(url, data);
    return data;
}

/*
  PLAIN ENGLISH: Get the name of one color, like "Bittersweet" for #ff6f61.
  LOGIC: Asks the /id question, then opens the answer: data, then the name drawer, then the value.
  WHY WE NEED IT: Each outfit piece shows its color's name under the bin name.
  LEARNING GAP: data.name.value matches the JSON you saw: "name":{"value":"Bittersweet",...}.
         An async function always hands back a Promise, so the caller must use await too.
  WHERE THE DATA COMES FROM: The Color API /id answer. The hex comes from the user's saved closet.
*/
export async function getColorName(hex) {
    const data = await getAnswer(`${BASE_URL}/id?hex=${cleanHex(hex)}`);
    return data.name.value;
}

/*
  PLAIN ENGLISH: Get up to 3 NEW colors that go well with one color, each with its hex and name.
         "New" means: not the same name as the starting color, and no name shown twice,
         even if two names differ only by an apostrophe, a space, or a capital letter.
  LOGIC: 1) Get the starting color's own name (like "Dandelion"). It's usually already saved
            in the Map, because the card asked for it a moment ago.
         2) Ask the /scheme question for 8 colors.
         3) Put the starting name's simple form in a Set called "seen."
         4) Go through the 8 colors. Keep a color only if its simple name is NOT in "seen,"
            then add its simple name to "seen." Stop keeping colors once we have 3.
         5) Each kept color becomes a small object: { hex: "#FB6759", name: "Sunset Orange" }.
  WHY WE NEED IT: Testing showed the API sometimes suggests the top's own color ("Dandelion goes
         with your Dandelion top") or the same name twice ("Blueberry, Blueberry" or
         "Screamin Green, Screamin' Green"). To a user, that looks like a glitch, and a glitch can
         make people trust the app less and leave. Skipping those keeps every idea clean and useful.
  LEARNING GAP: This is the same Set trick buildOutfits uses to skip duplicate outfits:
         seen.has(simple) asks "have we already used this name?"
         We keep only the hex and name. The full answer is HUGE (rgb, hsl, cmyk, and more),
         and smaller data is easier to work with.
         The list CAN come back with fewer than 3 colors, or even empty, for very dark or very light
         colors. shuffle.mjs handles that case with a friendly message.
  WHERE THE DATA COMES FROM: The Color API /scheme answer: "colors":[{"hex":{"value":...},"name":{"value":...}}],
         plus the /id answer for the starting color's name.
*/
export async function getColorMix(hex) {
    const startName = await getColorName(hex);

    const url = `${BASE_URL}/scheme?hex=${cleanHex(hex)}&mode=${MIX_MODE}&count=${MIX_ASK}`;
    const data = await getAnswer(url);

    const seen = new Set([simpleName(startName)]);
    const ideas = [];

    data.colors.forEach((color) => {
        const name = color.name.value;
        const simple = simpleName(name);
        if (ideas.length < MIX_SHOW && !seen.has(simple)) {
            seen.add(simple);
            ideas.push({ hex: color.hex.value, name: name });
        }
    });

    return ideas;
}