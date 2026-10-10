import { UNSPLASH_ACCESS_KEY } from "./config.mjs";

/*
  PLAIN ENGLISH: This file talks to Unsplash, a free photo website. It gets photos ONLY from
         6 hand-picked collections (photo folders) that I made on Unsplash, sorted by the color
         of the top. Every photo was chosen by me to be a modest, classic everyday look.
  LOGIC: fetch() asks Unsplash for the photos in one collection, with the key in a "header" that
         says which app is asking. Unsplash answers with JSON: a list of photos.
         async/await lets the code wait for the answer without freezing the page.
  WHY WE NEED IT: Card "Connect Unsplash + photo credit." This is the project's SECOND third-party API.
         The first version searched all of Unsplash, but the photos often didn't match the outfit
         and some weren't modest. Hand-picked collections fix both problems.
  LEARNING GAP: Like color-api.mjs, this file ONLY talks to the API. It doesn't build cards.
         shuffle.mjs does the drawing on the page. (The "API module" idea: one file for outside data.)
         The collections must be PUBLIC. A private collection is like a locked album that this
         key can't open.
  WHERE THE DATA COMES FROM: https://api.unsplash.com/collections/{id}/photos, using my 6 collections.
*/

/*
  PLAIN ENGLISH: The settings for every request.
  LOGIC: BASE_URL is the start of the collections address. PER_PAGE is how many photos to ask for
         (30 is the most Unsplash gives in one answer). RECENT_LIMIT is how many recently shown photos
         to avoid repeating. UTM is a tag Unsplash asks apps to add to credit links.
  WHY WE NEED IT: Stored once, so a change happens in ONE place, the same idea as CSS variables.
  LEARNING GAP: Unsplash's rules (the API Guidelines) require a credit link to the photographer
         and to Unsplash, with this utm tag added. That's the "photo credit" part of the card.
*/
const BASE_URL = "https://api.unsplash.com/collections";
const PER_PAGE = 30;
const RECENT_LIMIT = 3;
const UTM = "utm_source=shuffle_my_style&utm_medium=referral";

/*
  PLAIN ENGLISH: My 6 hand-picked photo folders, one per color family, with a friendly label for each.
  LOGIC: An object of objects. Each key (like "blues") holds the collection's ID from its Unsplash
         web address, plus the words shown on the card ("blue").
  WHY WE NEED IT: This is the "laundry piles." colorFamily() decides the pile, and this object says
         which Unsplash folder that pile lives in.
  LEARNING GAP: The ID is the middle part of the collection's address:
         unsplash.com/collections/z2Ds7Bvi08k/sms-blues → "z2Ds7Bvi08k".
         Adding photos to a folder on Unsplash needs NO code change. The app picks them up automatically.
*/
const COLLECTIONS = {
       neutrals: { id: "nXqa0X_7PQo", label: "neutral" },
       reds: { id: "Vy7BoFxXfqU", label: "red or pink" },
       oranges: { id: "Smg30x6_6nw", label: "yellow or orange" },
       greens: { id: "PByIq_8pX_c", label: "green" },
       blues: { id: "z2Ds7Bvi08k", label: "blue" },
       purples: { id: "1tyNi1V_uwk", label: "purple" },
};

/*
  PLAIN ENGLISH: A memory box that remembers each folder's photos after the first request.
  LOGIC: A Map stores pairs: the collection ID and the request for its photos (a Promise).
         Saving the Promise (not just the answer) means if 3 cards ask for blues at the same moment,
         only ONE request goes out, and all 3 cards share its answer.
  WHY WE NEED IT: The free Demo key allows about 50 requests per hour. With this, one visit uses
         at most 6 requests (one per folder), no matter how many times the user shuffles.
  LEARNING GAP: This memory lasts until the page reloads, the same as the Map in color-api.mjs.
*/
const photoLists = new Map();

/*
  PLAIN ENGLISH: A short list of the photos shown most recently, so they don't repeat right away.
  LOGIC: Holds up to 3 photo IDs. New ones go on the end with push(). The oldest comes off the
         front with shift().
  WHY WE NEED IT: Without it, two blue outfits on the same shuffle could show the SAME photo,
         which looks like a glitch.
  LEARNING GAP: This works like a "last 3 seen" list. It's a queue: first in, first out.
*/
const recentIds = [];

/*
  PLAIN ENGLISH: Turn a hex color like "#ff6f61" into its hue, saturation, and lightness.
         Hue = where it sits on the color wheel (0 to 360). Saturation = how colorful vs. gray (0 to 1).
         Lightness = how dark vs. light (0 to 1).
  LOGIC: 1) slice() cuts the hex into its red, green, and blue parts. parseInt(..., 16) reads each
            part as a base-16 number (00 to ff = 0 to 255). Dividing by 255 gives 0 to 1.
         2) The biggest and smallest of the three tell us lightness and saturation.
         3) Which part is biggest tells us roughly where the hue is on the wheel.
  WHY WE NEED IT: Deciding the color family is much easier with hue and lightness than with hex.
  LEARNING GAP: This is the standard RGB-to-HSL formula. CSS has hsl() colors too, using these same
         three ideas. You don't need to memorize the math, just what each of the 3 numbers means.
*/
function hexToHsl(hex) {
       const r = parseInt(hex.slice(1, 3), 16) / 255;
       const g = parseInt(hex.slice(3, 5), 16) / 255;
       const b = parseInt(hex.slice(5, 7), 16) / 255;

       const max = Math.max(r, g, b);
       const min = Math.min(r, g, b);
       const lightness = (max + min) / 2;
       const spread = max - min;

       if (spread === 0) {
              return { hue: 0, saturation: 0, lightness };
       }

       const saturation = spread / (1 - Math.abs(2 * lightness - 1));

       let hue;
       if (max === r) {
              hue = ((g - b) / spread) % 6;
       } else if (max === g) {
              hue = (b - r) / spread + 2;
       } else {
              hue = (r - g) / spread + 4;
       }
       hue = (hue * 60 + 360) % 360;

       return { hue, saturation, lightness };
}

/*
  PLAIN ENGLISH: Decide which of the 6 color folders a top belongs in.
  LOGIC: 1) Very dark, very light, or nearly gray = "neutrals" (black, white, gray).
         2) Dark orange = brown, muted red-orange = tan or dusty rose-brown, very light orange = beige.
            All go to "neutrals."
         3) Dark yellow-green = olive, which goes to "greens."
         4) Otherwise the hue decides: reds (incl. pinks), oranges (incl. yellows), greens, blues, purples.
  WHY WE NEED IT: The app has to know which folder to open. In testing, a dusty rose-brown
         ("Copper Rose") was wrongly treated as red. Rule 2 fixes that.
  LEARNING GAP: "return" ends the function as soon as one rule matches, so the ORDER matters.
         The neutral checks come first, because a nearly black red still looks black.
         The cut-off numbers are a judgment call, like drawing lines on a color wheel.
*/
function colorFamily(hex) {
       const { hue, saturation, lightness } = hexToHsl(hex);

       if (lightness < 0.2 || lightness > 0.9 || saturation < 0.15) return "neutrals";
       if (hue >= 10 && hue < 45 && lightness < 0.45) return "neutrals";
       if (hue < 45 && saturation < 0.35) return "neutrals";
       if (hue >= 15 && hue < 60 && lightness > 0.75) return "neutrals";
       if (hue >= 50 && hue < 70 && lightness < 0.35) return "greens";

       if (hue < 15 || hue >= 320) return "reds";
       if (hue < 70) return "oranges";
       if (hue < 165) return "greens";
       if (hue < 255) return "blues";
       return "purples";
}

/*
  PLAIN ENGLISH: Ask Unsplash for all the photos in one of my folders, and keep only what we need.
  LOGIC: 1) Build the address: /collections/{id}/photos?per_page=30, and fetch it.
            The key goes in the Authorization header as "Client-ID <key>".
         2) If the answer isn't OK (wrong key, private folder, too many requests), stop with an error.
         3) From each photo, keep only 6 things: its ID, the image address, a description,
            the photographer's name, their profile link, and the photo's Unsplash page.
  WHY WE NEED IT: The full answer for ONE photo has dozens of details. Keeping only what we use
         makes the data easier to work with.
  LEARNING GAP: This answer is a plain LIST of photos (data.map), not { results: [...] } like the
         search answer was. Different endpoints can shape their JSON differently, so always check.
         A 401 status means the key is wrong. A 404 usually means a wrong ID or a private folder.
         A 403 usually means the hourly limit was reached.
  WHERE THE DATA COMES FROM: The Unsplash /collections/{id}/photos answer:
         [].id, [].urls.small, [].alt_description, [].user.name, [].user.links.html, [].links.html.
*/
async function fetchCollection(id) {
       const params = new URLSearchParams({ per_page: PER_PAGE });

       const response = await fetch(`${BASE_URL}/${id}/photos?${params}`, {
              headers: {
                     Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                     "Accept-Version": "v1",
              },
       });

       if (!response.ok) {
              throw new Error(`Unsplash answered with status ${response.status}`);
       }

       const data = await response.json();
       return data.map((photo) => ({
              id: photo.id,
              imageUrl: photo.urls.small,
              description: photo.alt_description || "Outfit inspiration photo",
              photographer: photo.user.name,
              profileUrl: `${photo.user.links.html}?${UTM}`,
              photoUrl: `${photo.links.html}?${UTM}`,
       }));
}

/*
  PLAIN ENGLISH: Get a folder's photos from the memory box, or ask Unsplash the first time.
  LOGIC: If the folder isn't in the Map yet, start the request and save it. If the request fails,
         remove it from the Map so the next shuffle can try again instead of failing forever.
  WHY WE NEED IT: Keeps requests low (see photoLists above) and recovers from a bad moment
         (like a quick internet drop).
  LEARNING GAP: .catch() here handles the error, removes the failed request, then "throw" passes
         the error along, so showInspirationPhoto in shuffle.mjs can still show its calm message.
*/
function getCollectionPhotos(id) {
       if (!photoLists.has(id)) {
              const request = fetchCollection(id).catch((error) => {
                     photoLists.delete(id);
                     throw error;
              });
              photoLists.set(id, request);
       }
       return photoLists.get(id);
}

/*
  PLAIN ENGLISH: Pick one photo from a folder, avoiding the ones shown most recently.
  LOGIC: 1) filter() keeps photos NOT in the recent list.
         2) If every photo was shown recently (a small folder), allow any photo again.
         3) Pick one at random, add its ID to the recent list, and drop the oldest if the list is too long.
  WHY WE NEED IT: Gives variety on every shuffle and avoids the same photo on two cards.
  LEARNING GAP: includes() asks "is this ID in the list?" The ? : is a short if/else (a "ternary").
*/
function pickPhoto(photos) {
       const fresh = photos.filter((photo) => !recentIds.includes(photo.id));
       const choices = fresh.length > 0 ? fresh : photos;
       const photo = choices[Math.floor(Math.random() * choices.length)];

       recentIds.push(photo.id);
       if (recentIds.length > RECENT_LIMIT) {
              recentIds.shift();
       }

       return photo;
}

/*
  PLAIN ENGLISH: Get ONE hand-picked photo that matches the color of the outfit's top.
  LOGIC: 1) colorFamily() decides the folder (like "blues").
         2) Get that folder's photos (from memory or from Unsplash).
         3) If the folder is empty, return null ("nothing found").
         4) Otherwise, pick a photo and add the folder's label (like "blue") for the card's note.
  WHY WE NEED IT: shuffle.mjs calls this once per outfit card.
  LEARNING GAP: An async function always hands back a Promise, so the caller must use await.
         The match is by the TOP's color, because the top is the biggest, most noticeable piece,
         and it's how I sorted the photos into folders.
  WHERE THE DATA COMES FROM: getCollectionPhotos (above), using the top's hex color from the user's closet.
*/
export async function getOutfitPhoto(topHex) {
       const family = COLLECTIONS[colorFamily(topHex)];
       const photos = await getCollectionPhotos(family.id);

       if (photos.length === 0) {
              return null;
       }

       return { ...pickPhoto(photos), label: family.label };
}

/*
  PLAIN ENGLISH: The link to Unsplash's home page, with the same utm tag, for the credit line.
  LOGIC: A small exported value, so shuffle.mjs doesn't have to rebuild the address itself.
  WHY WE NEED IT: The credit line must say "Photo by [name] on Unsplash," with BOTH names linked.
  LEARNING GAP: Exporting a const (not just functions) is fine. It's how config.mjs shares the key, too.
*/
export const UNSPLASH_HOME = `https://unsplash.com/?${UTM}`;