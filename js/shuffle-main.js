import {
    getCheckedAccessories,
    findMissingBins,
    buildOutfits,
    renderOutfits,
    renderMissingMessage,
} from "./shuffle.mjs";

/*
  PLAIN ENGLISH: Find the parts of the Shuffle page we need to work with.
  LOGIC: querySelector finds each element by its id (#).
  WHY WE NEED IT: JavaScript has to "grab" an element before it can use it.
  LEARNING GAP: These ids must match shuffle.html exactly, or you get null.
*/
const shuffleBtn = document.querySelector("#shuffle-btn");
const accessoryPicks = document.querySelector("#accessory-picks");
const outfitList = document.querySelector("#outfit-list");

/*
  PLAIN ENGLISH: When SHUFFLE is clicked, check the closet, then build and show 3 outfits.
  LOGIC: 1) If any required bin is empty, show the friendly message and stop (return).
         2) Otherwise, read the checked pills, build 3 outfits, and show them.
  WHY WE NEED IT: Card "Shuffles picks 3 outfits." This brings the SHUFFLE button to life.
  LEARNING GAP: "return" ends the function early, so the outfit code never runs when
         clothes are missing. This file is the "starter," like main.js on the closet page.
         It calls the functions but doesn't hold the details.
  WHERE THE DATA COMES FROM: The saved closet (through shuffle.mjs) and the checked pills.
*/
shuffleBtn.addEventListener("click", () => {
    const missing = findMissingBins();

    if (missing.length > 0) {
        renderMissingMessage(outfitList, missing);
        return;
    }

    const accessories = getCheckedAccessories(accessoryPicks);
    const outfits = buildOutfits(accessories);
    renderOutfits(outfitList, outfits);
});