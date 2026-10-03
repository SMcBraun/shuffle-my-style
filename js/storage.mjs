/*
  PLAIN ENGLISH: Saves the closet in the browser and loads it back.
  LOGIC: localStorage only stores text. JSON.stringify turns the list into
         text to save. JSON.parse turns the text back into a list.
  WHY WE NEED IT: Card "Save clothes in browser." The closet is still there
         after a refresh or after closing the tab.
  LEARNING GAP: The data lives only in THIS browser on THIS device. It's the
         same pattern as the SleepOutside cart.
  WHERE THE DATA COMES FROM: The add-item form, passed in through closet.mjs.
*/
const STORAGE_KEY = "sms-closet";

/*
  PLAIN ENGLISH: Get the saved closet list.
  LOGIC: If nothing is saved yet, return an empty list [].
  WHY WE NEED IT: The first visit has no data, and the app must not crash.
  LEARNING GAP: JSON.parse(null) causes problems, so we check first.
*/
export function getCloset() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

/*
  PLAIN ENGLISH: Save the whole closet list.
  LOGIC: Turn the list into text, then store it under one name (the key).
  WHY WE NEED IT: Called after every add and every delete.
  LEARNING GAP: This saves the WHOLE list each time. It replaces the old
         copy. It doesn't add on top.
*/
export function saveCloset(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}