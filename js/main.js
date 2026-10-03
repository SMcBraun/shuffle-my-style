import { fillBinOptions, addItem, deleteItem, renderCloset } from "./closet.mjs";

/*
  PLAIN ENGLISH: Find the parts of the page we need to work with.
  LOGIC: querySelector finds each element by its id (#).
  WHY WE NEED IT: JavaScript has to "grab" an element before it can use it.
  LEARNING GAP: These ids must match index.html exactly, or you get null.
*/
const form = document.querySelector("#item-form");
const binSelect = document.querySelector("#item-bin");
const colorInput = document.querySelector("#item-color");
const closetBins = document.querySelector("#closet-bins");

/*
  PLAIN ENGLISH: When the page loads, fill the dropdown and show the closet.
  LOGIC: Calls the two set-up functions from closet.mjs.
  WHY WE NEED IT: Saved clothes appear right away on every visit.
  LEARNING GAP: main.js is the "starter." It calls the functions but doesn't
         hold the details.
*/
fillBinOptions(binSelect);
renderCloset(closetBins);

/*
  PLAIN ENGLISH: When the user clicks "Add Item," save it and redraw.
  LOGIC: preventDefault stops the page from reloading. Then add, redraw,
         and clear the form.
  WHY WE NEED IT: Card "Build item-card form."
  LEARNING GAP: Without preventDefault, the form refreshes the page, and
         it looks like nothing happened.
*/
form.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(binSelect.value, colorInput.value);
    renderCloset(closetBins);
    form.reset();
    binSelect.focus();
});

/*
  PLAIN ENGLISH: When any Delete button is clicked, remove that item.
  LOGIC: One listener on the whole closet area checks if the click was a
         Delete button (event delegation).
  WHY WE NEED IT: Card "Delete button." The buttons are created later by
         JavaScript, so we listen on the parent that's always there.
  LEARNING GAP: dataset.id reads the data-id that renderCloset put on the
         button.
*/
closetBins.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        deleteItem(event.target.dataset.id);
        renderCloset(closetBins);
    }
});