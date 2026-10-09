/*
  PLAIN ENGLISH: Saves the closet AND the favorite outfits in the browser, and loads them back.
  LOGIC: localStorage only stores text. JSON.stringify turns a list into
         text to save. JSON.parse turns the text back into a list.
         Each kind of data gets its own key (its own "drawer"): one for the closet,
         one for favorites.
  WHY WE NEED IT: Card "Save clothes in browser" (closet) and card "Save favorites."
         Everything is still there after a refresh or after closing the tab.
  LEARNING GAP: The data lives only in THIS browser on THIS device. It's the
         same pattern as the SleepOutside cart.
         This file is the ONLY place that touches localStorage. Other files ask it
         to load or save. One "storage helper" file keeps the rules in one spot.
  WHERE THE DATA COMES FROM: The add-item form (through closet.mjs) and the
         Save / Wore it buttons (through favorites.mjs).
*/
const STORAGE_KEY = "sms-closet";
const FAVORITES_KEY = "sms-favorites";

/*
  PLAIN ENGLISH: Load any saved list by its key. If nothing is saved yet, return an empty list.
  LOGIC: getItem reads the text. If there is text, JSON.parse turns it back into a list.
         If there is none (first visit), we return [] instead.
  WHY WE NEED IT: Both getCloset and getFavorites do the exact same steps,
         so the steps are written once here and shared.
  LEARNING GAP: JSON.parse(null) causes problems, so we check first.
         This helper isn't exported. It stays private to this file.
*/
function loadList(key) {
       const saved = localStorage.getItem(key);
       return saved ? JSON.parse(saved) : [];
}

/*
  PLAIN ENGLISH: Save any whole list under its key.
  LOGIC: Turn the list into text, then store it under one name (the key).
  WHY WE NEED IT: Shared by saveCloset and saveFavorites.
  LEARNING GAP: This saves the WHOLE list each time. It replaces the old
         copy. It doesn't add on top.
*/
function saveList(key, list) {
       localStorage.setItem(key, JSON.stringify(list));
}

/*
  PLAIN ENGLISH: Get the saved closet list.
  LOGIC: Uses loadList with the closet key.
  WHY WE NEED IT: The closet page and the shuffle both need the user's clothes.
  LEARNING GAP: The name and result are the same as before, so closet.mjs and
         shuffle.mjs keep working without any changes.
*/
export function getCloset() {
       return loadList(STORAGE_KEY);
}

/*
  PLAIN ENGLISH: Save the whole closet list.
  LOGIC: Uses saveList with the closet key.
  WHY WE NEED IT: Called after every add and every delete.
  LEARNING GAP: Same name and job as before. Only the inside moved to the shared helper.
*/
export function saveCloset(items) {
       saveList(STORAGE_KEY, items);
}

/*
  PLAIN ENGLISH: Get the saved favorite outfits.
  LOGIC: Uses loadList with the favorites key.
  WHY WE NEED IT: Card "Save favorites." The Saved Outfits section shows this list.
  LEARNING GAP: Favorites live in their OWN drawer ("sms-favorites"), separate from the closet.
         That way, deleting a shirt from the closet doesn't break a saved outfit.
  WHERE THE DATA COMES FROM: The Save button and the Wore it button (favorites.mjs).
*/
export function getFavorites() {
       return loadList(FAVORITES_KEY);
}

/*
  PLAIN ENGLISH: Save the whole favorites list.
  LOGIC: Uses saveList with the favorites key.
  WHY WE NEED IT: Called after saving, removing, or marking an outfit as worn.
  LEARNING GAP: You can see both drawers in DevTools: Application tab > Local Storage.
*/
export function saveFavorites(favorites) {
       saveList(FAVORITES_KEY, favorites);
}