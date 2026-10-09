import {
  getCheckedAccessories,
  findMissingBins,
  buildOutfits,
  renderOutfits,
  renderMissingMessage,
} from "./shuffle.mjs";
import {
  toggleFavorite,
  removeFavorite,
  markWorn,
  syncSaveButtons,
  renderFavorites,
} from "./favorites.mjs";

/*
  PLAIN ENGLISH: Find the parts of the Shuffle page we need to work with.
  LOGIC: querySelector finds each element by its id (#).
  WHY WE NEED IT: JavaScript has to "grab" an element before it can use it.
  LEARNING GAP: These ids must match shuffle.html exactly, or you get null.
*/
const shuffleBtn = document.querySelector("#shuffle-btn");
const accessoryPicks = document.querySelector("#accessory-picks");
const outfitList = document.querySelector("#outfit-list");
const favoriteList = document.querySelector("#favorite-list");
const favoritesStatus = document.querySelector("#favorites-status");

/*
  PLAIN ENGLISH: Remember the outfits that are on the screen right now.
  LOGIC: Starts empty ([]). Every shuffle replaces it with the new outfits.
  WHY WE NEED IT: When a Save button is clicked, its data-index (0, 1, or 2) points to
         a spot in THIS list, so we know exactly which outfit to save.
  LEARNING GAP: It's "let," not "const," because we give it a brand-new list on every shuffle.
*/
let currentOutfits = [];

/*
  PLAIN ENGLISH: Tell screen reader users what just happened ("Outfit saved.").
  LOGIC: The #favorites-status paragraph is hidden from the eye but has aria-live="polite".
         Changing its words makes a screen reader read them out loud.
  WHY WE NEED IT: Clicking Save or Wore it changes the page quietly. Sighted users SEE the change,
         and this message lets everyone else HEAR it. It's part of the accessibility card in Week 7.
  LEARNING GAP: "polite" waits until the screen reader finishes what it's saying, then speaks.
*/
function announce(message) {
  favoritesStatus.textContent = message;
}

/*
  PLAIN ENGLISH: When the page opens, show any outfits saved on earlier visits.
  LOGIC: renderFavorites reads the saved list from localStorage and builds the cards.
  WHY WE NEED IT: Card "Save favorites." Saved looks are waiting for the user every time.
  LEARNING GAP: This runs once, right away, the same as renderCloset on the closet page.
*/
renderFavorites(favoriteList);

/*
  PLAIN ENGLISH: When SHUFFLE is clicked, check the closet, then build and show 3 outfits.
  LOGIC: 1) If any required bin is empty, show the friendly message and stop (return).
         2) Otherwise, read the checked pills, build 3 outfits, remember them, and show them.
  WHY WE NEED IT: Card "Shuffles picks 3 outfits." This brings the SHUFFLE button to life.
  LEARNING GAP: "return" ends the function early, so the outfit code never runs when
         clothes are missing. currentOutfits is cleared then, so old Save buttons can't point
         to outfits that are no longer on the screen.
  WHERE THE DATA COMES FROM: The saved closet (through shuffle.mjs) and the checked pills.
*/
shuffleBtn.addEventListener("click", () => {
  const missing = findMissingBins();

  if (missing.length > 0) {
    currentOutfits = [];
    renderMissingMessage(outfitList, missing);
    return;
  }

  const accessories = getCheckedAccessories(accessoryPicks);
  currentOutfits = buildOutfits(accessories);
  renderOutfits(outfitList, currentOutfits);
});

/*
  PLAIN ENGLISH: When a Save button on an outfit card is clicked, save that outfit
         (or un-save it if it's already saved), then update the Saved Outfits section.
  LOGIC: ONE listener sits on the whole outfit area (event delegation).
         closest(".save-btn") finds the Save button even if the click landed on its text.
         If the click wasn't on a Save button, "return" stops here.
         data-index tells us which outfit in currentOutfits to save.
  WHY WE NEED IT: Card "Save favorites." The Save buttons are made by JavaScript AFTER the page
         loads, so we listen on the parent (#outfit-list) that's always there.
  LEARNING GAP: closest() checks the element itself and then its parents, so it's safer than
         event.target.classList, which only checks the exact thing clicked.
         This is the same "listen on the parent" idea as the closet's Delete buttons.
  WHERE THE DATA COMES FROM: currentOutfits (from the last shuffle) and the button's data-index.
*/
outfitList.addEventListener("click", (event) => {
  const saveBtn = event.target.closest(".save-btn");
  if (!saveBtn) {
    return;
  }

  const outfit = currentOutfits[Number(saveBtn.dataset.index)];
  if (!outfit) {
    return;
  }

  const nowSaved = toggleFavorite(outfit);
  syncSaveButtons(outfitList, currentOutfits);
  renderFavorites(favoriteList);
  announce(nowSaved ? "Outfit saved to your favorites." : "Outfit removed from your favorites.");
});

/*
  PLAIN ENGLISH: When "Wore it today" or "Remove" is clicked on a saved outfit, do that job.
  LOGIC: ONE listener on the whole Saved Outfits area (event delegation again).
         closest("button[data-action]") finds the clicked button. data-action says which job
         ("worn" or "remove"), and data-id says which favorite.
         After the change, the section is redrawn and the outfit cards' Save buttons are updated.
  WHY WE NEED IT: Card "Wear counter" (Wore it today) and card "Save favorites" (Remove).
  LEARNING GAP: Redrawing the cards removes the button that had keyboard focus. For "worn,"
         we find the NEW button with the same id and focus() it, so keyboard users don't get
         sent back to the top of the page.
  WHERE THE DATA COMES FROM: The data-action and data-id on the buttons (set in renderFavorites).
*/
favoriteList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const id = button.dataset.id;

  if (button.dataset.action === "worn") {
    const count = markWorn(id);
    renderFavorites(favoriteList);
    const word = count === 1 ? "time" : "times";
    announce(`Marked as worn today. Worn ${count} ${word}.`);
    favoriteList.querySelector(`[data-action="worn"][data-id="${id}"]`)?.focus();
  }

  if (button.dataset.action === "remove") {
    removeFavorite(id);
    renderFavorites(favoriteList);
    syncSaveButtons(outfitList, currentOutfits);
    announce("Saved outfit removed.");
  }
});