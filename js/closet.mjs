import { getCloset, saveCloset } from "./storage.mjs";

/*
  PLAIN ENGLISH: The 6 closet bins from the proposal.
  LOGIC: One list used by the form dropdown AND the closet display.
  WHY WE NEED IT: Card "Make the 6 bins." To add or rename a bin, you change
         it in ONE place.
  LEARNING GAP: "export" lets main.js use this list. Without it, the list
         stays private to this file.
*/
export const BINS = ["Tops", "Bottoms", "Shoes", "Hats", "Bags", "Accents"];

/*
  PLAIN ENGLISH: Fill the form's dropdown with the 6 bins.
  LOGIC: Loop through BINS and make one <option> for each.
  WHY WE NEED IT: The HTML doesn't have to repeat the bin names.
  LEARNING GAP: value = what gets saved. textContent = what the user sees.
*/
export function fillBinOptions(select) {
    BINS.forEach((bin) => {
        const option = document.createElement("option");
        option.value = bin;
        option.textContent = bin;
        select.appendChild(option);
    });
}

/*
  PLAIN ENGLISH: Add one clothing item to the closet.
  LOGIC: Load the list, add the new item, and save the list again.
  WHY WE NEED IT: Runs when the user clicks "Add Item."
  LEARNING GAP: Date.now() gives each item a unique id number, so Delete
         knows exactly which item to remove.
  WHERE THE DATA COMES FROM: The bin dropdown and color picker in the form.
*/
export function addItem(bin, color) {
    const items = getCloset();
    items.push({ id: Date.now().toString(), bin, color });
    saveCloset(items);
}

/*
  PLAIN ENGLISH: Remove one item from the closet.
  LOGIC: filter() keeps every item EXCEPT the one with this id, then saves.
  WHY WE NEED IT: Card "Delete button."
  LEARNING GAP: filter() makes a NEW list. It doesn't change the old one.
         So we must save the new list.
*/
export function deleteItem(id) {
    const items = getCloset().filter((item) => item.id !== id);
    saveCloset(items);
}

/*
  PLAIN ENGLISH: Show the closet on the page, grouped into the 6 bins.
  LOGIC: Clear the area, then for each bin, show its items as a color circle,
         a color code, and a Delete button. Empty bins say "No items yet."
  WHY WE NEED IT: Card "Show closet by bin."
  LEARNING GAP: We use textContent (not innerHTML) for the item text. It's
         safer, because it never runs code typed into the page.
  WHERE THE DATA COMES FROM: The saved list in localStorage (getCloset).
*/
export function renderCloset(container) {
    const items = getCloset();
    container.innerHTML = "";

    BINS.forEach((bin) => {
        const binItems = items.filter((item) => item.bin === bin);

        const binBox = document.createElement("div");
        binBox.className = "bin";

        const heading = document.createElement("h3");
        heading.textContent = `${bin} (${binItems.length})`;
        binBox.appendChild(heading);

        if (binItems.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty";
            empty.textContent = "No items yet.";
            binBox.appendChild(empty);
        } else {
            const list = document.createElement("ul");

            binItems.forEach((item) => {
                const li = document.createElement("li");

                const swatch = document.createElement("span");
                swatch.className = "swatch";
                swatch.style.backgroundColor = item.color;

                const label = document.createElement("span");
                label.textContent = item.color;

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "delete-btn";
                deleteBtn.dataset.id = item.id;
                deleteBtn.textContent = "Delete";
                deleteBtn.setAttribute("aria-label", `Delete ${bin} item ${item.color}`);

                li.append(swatch, label, deleteBtn);
                list.appendChild(li);
            });

            binBox.appendChild(list);
        }

        container.appendChild(binBox);
    });
}