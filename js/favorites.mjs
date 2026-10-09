import { getFavorites, saveFavorites } from "./storage.mjs";
import { drawOutfit } from "./outfit-drawing.mjs";

/*
  PLAIN ENGLISH: This file handles favorite outfits: saving them, removing them,
         counting how many times each one was worn, and showing them on the page.
  LOGIC: Every change follows the same 3 steps: load the list, change it, save the whole list.
         Then shuffle-main.js asks renderFavorites to redraw the Saved Outfits section.
  WHY WE NEED IT: Card "Save favorites" and card "Wear counter."
         The proposal promised users could keep outfits they love and see how often they wear them,
         so they notice which clothes they keep repeating.
  LEARNING GAP: This file never touches localStorage directly. It asks storage.mjs,
         the same way closet.mjs does. One job per file keeps things easy to find.
  WHERE THE DATA COMES FROM: The outfits built by shuffle.mjs, and the saved list in
         localStorage ("sms-favorites").
*/

/*
  PLAIN ENGLISH: Make an outfit's "fingerprint" from the IDs of its pieces, like "1717-1820-1903".
  LOGIC: map() pulls out each piece's id. join("-") glues them into one piece of text.
  WHY WE NEED IT: The fingerprint becomes the favorite's id. It's how we know if an outfit
         is already saved, so the same outfit is never saved twice.
  LEARNING GAP: This matches outfitKey in shuffle.mjs. We keep a copy here instead of importing it,
         because shuffle.mjs already imports from THIS file. Two files importing from each other
         (a "circular import") can cause confusing bugs.
*/
function makeFavoriteId(outfit) {
    return outfit.map((item) => item.id).join("-");
}

/*
  PLAIN ENGLISH: Check if an outfit is already saved.
  LOGIC: some() asks "does ANY favorite have this id?" and answers true or false.
  WHY WE NEED IT: The Save button shows "Saved" for outfits already in favorites.
  LEARNING GAP: some() stops looking as soon as it finds one match, so it's quick.
  WHERE THE DATA COMES FROM: The saved favorites (getFavorites).
*/
export function isFavorite(outfit) {
    const id = makeFavoriteId(outfit);
    return getFavorites().some((favorite) => favorite.id === id);
}

/*
  PLAIN ENGLISH: Save an outfit, or un-save it if it's already saved (a toggle).
  LOGIC: 1) Make the outfit's id and load the favorites.
         2) If it's already there, filter() it out, save, and return false ("not saved now").
         3) If not, build a favorite object, add it to the FRONT with unshift(),
            save, and return true ("saved now").
  WHY WE NEED IT: Card "Save favorites." One button both saves and un-saves, like a heart
         button on a shopping site.
  LEARNING GAP: Each favorite stores 5 properties: id, pieces, savedAt, timesWorn, lastWorn.
         We store a COPY of each piece (id, bin, color), not just the ids. If the user later
         deletes that shirt from the closet, the saved outfit still knows its colors.
         unshift() adds to the FRONT of a list (push() adds to the END), so the newest
         favorite shows first.
         toISOString() saves the date as text like "2026-10-08T21:15:00.000Z", which
         localStorage can store and JavaScript can turn back into a date later.
  WHERE THE DATA COMES FROM: The outfit the user clicked Save on (from buildOutfits).
*/
export function toggleFavorite(outfit) {
    const id = makeFavoriteId(outfit);
    const favorites = getFavorites();

    if (favorites.some((favorite) => favorite.id === id)) {
        saveFavorites(favorites.filter((favorite) => favorite.id !== id));
        return false;
    }

    favorites.unshift({
        id: id,
        pieces: outfit.map((item) => ({ id: item.id, bin: item.bin, color: item.color })),
        savedAt: new Date().toISOString(),
        timesWorn: 0,
        lastWorn: null,
    });
    saveFavorites(favorites);
    return true;
}

/*
  PLAIN ENGLISH: Remove one favorite by its id.
  LOGIC: filter() keeps every favorite EXCEPT the one with this id, then we save the shorter list.
  WHY WE NEED IT: The Remove button in the Saved Outfits section.
  LEARNING GAP: It's the same filter() trick as deleteItem in closet.mjs.
  WHERE THE DATA COMES FROM: The data-id on the Remove button (set in renderFavorites).
*/
export function removeFavorite(id) {
    const favorites = getFavorites().filter((favorite) => favorite.id !== id);
    saveFavorites(favorites);
}

/*
  PLAIN ENGLISH: Add 1 to an outfit's "times worn" and remember today as the last time it was worn.
  LOGIC: find() gets the matching favorite. += 1 adds one to the count.
         lastWorn gets today's date as text. Then the whole list is saved.
         The new count is returned so shuffle-main.js can announce it.
  WHY WE NEED IT: Card "Wear counter." Users see which outfits they repeat and which they forget.
  LEARNING GAP: find() hands back the actual object INSIDE the list, so changing it changes
         the list too. That's why saving "favorites" afterward keeps the new count.
         If no match is found, find() returns undefined, so we check before changing anything.
  WHERE THE DATA COMES FROM: The data-id on the Wore it button.
*/
export function markWorn(id) {
    const favorites = getFavorites();
    const favorite = favorites.find((item) => item.id === id);

    if (!favorite) {
        return 0;
    }

    favorite.timesWorn += 1;
    favorite.lastWorn = new Date().toISOString();
    saveFavorites(favorites);
    return favorite.timesWorn;
}

/*
  PLAIN ENGLISH: Turn the saved date text into something friendly, like "Oct 8, 2026".
  LOGIC: new Date() turns the saved text back into a date. toLocaleDateString() formats it.
  WHY WE NEED IT: "2026-10-08T21:15:00.000Z" is hard for people to read.
  LEARNING GAP: "en-US" and the options control the style: short month, number day, full year.
*/
function friendlyDate(isoText) {
    return new Date(isoText).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/*
  PLAIN ENGLISH: Write the wear count as a short sentence.
  LOGIC: 0 times = "Not worn yet." 1 time = "Worn 1 time" (no s). More = "Worn 3 times."
         If it was worn, the last date is added after a dot.
  WHY WE NEED IT: "Worn 1 times" would look like a mistake to users.
  LEARNING GAP: The ? : is a short if/else (a ternary), the same as the outfit note in shuffle.mjs.
*/
function wornText(favorite) {
    if (favorite.timesWorn === 0) {
        return "Not worn yet";
    }
    const word = favorite.timesWorn === 1 ? "time" : "times";
    return `Worn ${favorite.timesWorn} ${word} · Last worn ${friendlyDate(favorite.lastWorn)}`;
}

/*
  PLAIN ENGLISH: Make the Save button for one outfit card.
  LOGIC: data-index remembers WHICH of the 3 outfits this button belongs to (0, 1, or 2).
         setSaveState sets the right words and look.
  WHY WE NEED IT: Card "Save favorites." Each outfit card gets its own Save button.
  LEARNING GAP: The button doesn't get its own click listener. shuffle-main.js uses ONE listener
         on the whole outfit area (event delegation), the same as the closet's Delete buttons.
*/
export function makeSaveButton(outfit, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "save-btn";
    button.dataset.index = index;
    setSaveState(button, isFavorite(outfit));
    return button;
}

/*
  PLAIN ENGLISH: Show "Save outfit" or "Saved" on a Save button.
  LOGIC: aria-pressed="true" tells screen readers the button is turned ON (saved).
         The CSS uses the same aria-pressed value to fill the button with sunny yellow.
  WHY WE NEED IT: The user always sees if an outfit is already saved.
  LEARNING GAP: aria-pressed makes a regular button act like an on/off switch for screen readers.
         Styling with [aria-pressed="true"] means the look and the accessibility info can't disagree.
*/
function setSaveState(button, saved) {
    button.setAttribute("aria-pressed", saved ? "true" : "false");
    button.textContent = saved ? "♥ Saved" : "♡ Save outfit";
}

/*
  PLAIN ENGLISH: Update every Save button on the outfit cards to match the saved list.
  LOGIC: Find all the Save buttons. For each one, use its data-index to find its outfit,
         then set "Saved" or "Save outfit."
  WHY WE NEED IT: If the user removes a favorite down in Saved Outfits, the matching outfit
         card above should switch back to "Save outfit."
  LEARNING GAP: dataset.index is TEXT ("0"), so Number() turns it into a number to use as a position.
*/
export function syncSaveButtons(container, outfits) {
    container.querySelectorAll(".save-btn").forEach((button) => {
        const outfit = outfits[Number(button.dataset.index)];
        if (outfit) {
            setSaveState(button, isFavorite(outfit));
        }
    });
}

/*
  PLAIN ENGLISH: Show all saved outfits as cards in the Saved Outfits section.
  LOGIC: Clear the area. If nothing is saved, show a friendly message.
         Otherwise, for each favorite, build a card with: a title ("Saved Look 1"),
         the coloring-book drawing, the list of pieces, the wear count, and two buttons
         (Wore it today and Remove).
  WHY WE NEED IT: Cards "Save favorites" and "Wear counter." Users see their saved looks
         and how often they wear each one.
  LEARNING GAP: The cards reuse .outfit-card, .outfit-pieces, .swatch, and .delete-btn,
         so they match the rest of the app with very little new CSS.
         data-action tells shuffle-main.js WHICH button was clicked ("worn" or "remove"),
         and data-id tells it WHICH favorite.
         We use textContent, not innerHTML, for safety, the same as everywhere else.
  WHERE THE DATA COMES FROM: The saved favorites in localStorage (getFavorites).
*/
export function renderFavorites(container) {
    const favorites = getFavorites();
    container.innerHTML = "";

    if (favorites.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No saved outfits yet. Shuffle, then tap ♡ Save outfit on a look you love.";
        container.appendChild(empty);
        return;
    }

    favorites.forEach((favorite, index) => {
        const lookName = `Saved Look ${index + 1}`;

        const card = document.createElement("article");
        card.className = "outfit-card favorite-card";

        const heading = document.createElement("h3");
        heading.textContent = lookName;
        card.appendChild(heading);

        card.appendChild(drawOutfit(favorite.pieces));

        const list = document.createElement("ul");
        list.className = "outfit-pieces";

        favorite.pieces.forEach((piece) => {
            const li = document.createElement("li");

            const swatch = document.createElement("span");
            swatch.className = "swatch";
            swatch.style.backgroundColor = piece.color;

            const binName = document.createElement("span");
            binName.className = "piece-bin";
            binName.textContent = piece.bin;

            const colorCode = document.createElement("span");
            colorCode.className = "piece-color";
            colorCode.textContent = piece.color;

            li.append(swatch, binName, colorCode);
            list.appendChild(li);
        });

        card.appendChild(list);

        const worn = document.createElement("p");
        worn.className = "worn-count";
        worn.textContent = wornText(favorite);
        card.appendChild(worn);

        const actions = document.createElement("div");
        actions.className = "favorite-actions";

        const wornBtn = document.createElement("button");
        wornBtn.type = "button";
        wornBtn.className = "wore-btn";
        wornBtn.dataset.action = "worn";
        wornBtn.dataset.id = favorite.id;
        wornBtn.textContent = "Wore it today";
        wornBtn.setAttribute("aria-label", `Mark ${lookName} as worn today`);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "delete-btn";
        removeBtn.dataset.action = "remove";
        removeBtn.dataset.id = favorite.id;
        removeBtn.textContent = "Remove";
        removeBtn.setAttribute("aria-label", `Remove ${lookName}`);

        actions.append(wornBtn, removeBtn);
        card.appendChild(actions);

        container.appendChild(card);
    });
}