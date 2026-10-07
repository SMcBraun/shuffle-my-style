import { getCloset } from "./storage.mjs";
import { drawOutfit } from "./outfit-drawing.mjs";

/*
  PLAIN ENGLISH: The three bins every outfit must have.
  LOGIC: A list we loop through when building each outfit.
  WHY WE NEED IT: An outfit isn't complete without a top, bottom, and shoes.
  LEARNING GAP: These names must match the BINS list in closet.mjs exactly
         ("Tops", not "Top"), because saved items store the bin name.
*/
export const REQUIRED_BINS = ["Tops", "Bottoms", "Shoes"];

/*
  PLAIN ENGLISH: How many outfits one shuffle makes.
  LOGIC: Stored in one place, the same idea as CSS variables.
  WHY WE NEED IT: The proposal says 3 outfits. To change it, edit ONE line.
  LEARNING GAP: Not exported, because only this file uses it. It stays private.
*/
const OUTFIT_COUNT = 3;

/*
  PLAIN ENGLISH: The most times the shuffle will try to find a new, different outfit.
  LOGIC: A safety limit for the while loop in buildOutfits.
  WHY WE NEED IT: Without a limit, a small closet could make the loop run forever
         and freeze the page.
  LEARNING GAP: Every while loop needs a guaranteed way to stop. This is a backup on top
         of countPossibleOutfits.
*/
const MAX_TRIES = 100;

/*
  PLAIN ENGLISH: Find out which accessory pills are checked.
  LOGIC: querySelectorAll finds every checked box in the group.
         map() turns the list of boxes into a list of their values, like ["Hats", "Accents"].
  WHY WE NEED IT: Card "Accessory checkboxes." The shuffle only adds the extras the user chose.
  LEARNING GAP: querySelectorAll gives a NodeList, not a real array. Array.from() converts it
         so we can use map().
  WHERE THE DATA COMES FROM: The checkboxes in shuffle.html (name="accessory").
*/
export function getCheckedAccessories(fieldset) {
    const checked = fieldset.querySelectorAll('input[name="accessory"]:checked');
    return Array.from(checked).map((box) => box.value);
}

/*
  PLAIN ENGLISH: Pick one random item from a list.
  LOGIC: Math.random() gives a number from 0 up to (not including) 1. Multiplying by the
         list length and rounding down with Math.floor gives a valid position (index).
  WHY WE NEED IT: This is the "shuffle." Every click can pick something different.
  LEARNING GAP: Lists start counting at 0. A list of 3 has positions 0, 1, and 2,
         which is why we round DOWN, never up.
*/
function pickRandom(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
}

/*
  PLAIN ENGLISH: Get only the clothes from one bin.
  LOGIC: filter() keeps items whose bin matches.
  WHY WE NEED IT: Used to find all the tops, all the shoes, and so on.
  LEARNING GAP: It's the same filter() idea as renderCloset in closet.mjs.
*/
function itemsInBin(items, bin) {
    return items.filter((item) => item.bin === bin);
}

/*
  PLAIN ENGLISH: Check which required bins are empty.
  LOGIC: Loads the closet, then keeps any required bin that has 0 items.
  WHY WE NEED IT: We can't build an outfit with no shoes, so we warn the user instead.
  LEARNING GAP: An empty list [] means "nothing is missing," which is good news.
  WHERE THE DATA COMES FROM: The saved closet in localStorage (getCloset).
*/
export function findMissingBins() {
    const items = getCloset();
    return REQUIRED_BINS.filter((bin) => itemsInBin(items, bin).length === 0);
}

/*
  PLAIN ENGLISH: Count how many DIFFERENT outfits this closet can make.
  LOGIC: Multiply the number of items in each bin we're using. Example: 2 tops x 3 bottoms
         x 1 shoes = 6 possible outfits. Empty accessory bins are skipped (counted as x 1).
  WHY WE NEED IT: If the closet can only make 2 different outfits, we stop at 2 instead of
         trying forever to find a 3rd.
  LEARNING GAP: reduce() walks through a list and builds up ONE answer, here a running total.
         It starts at 1, not 0, because anything multiplied by 0 is 0.
*/
function countPossibleOutfits(items, bins) {
    return bins.reduce((total, bin) => {
        const count = itemsInBin(items, bin).length;
        return count > 0 ? total * count : total;
    }, 1);
}

/*
  PLAIN ENGLISH: Make a "fingerprint" for an outfit from the IDs of its pieces.
  LOGIC: map() pulls out each item's id. join("-") glues them into one piece of text,
         like "1717-1820-1903".
  WHY WE NEED IT: Two outfits with the same fingerprint are duplicates.
  LEARNING GAP: We compare IDs, not colors, because two different shirts could be the
         same color. The IDs come from Date.now() in addItem (closet.mjs), so each is unique.
*/
function outfitKey(outfit) {
    return outfit.map((item) => item.id).join("-");
}

/*
  PLAIN ENGLISH: Build ONE outfit: one random item from each bin we need.
  LOGIC: Loop through the bins. If a bin has clothes, pick one at random and add it.
         Empty accessory bins are skipped quietly.
  WHY WE NEED IT: buildOutfits calls this until it has enough different outfits.
  LEARNING GAP: push() adds an item to the END of a list.
*/
function buildOneOutfit(items, bins) {
    const outfit = [];
    bins.forEach((bin) => {
        const choices = itemsInBin(items, bin);
        if (choices.length > 0) {
            outfit.push(pickRandom(choices));
        }
    });
    return outfit;
}

/*
  PLAIN ENGLISH: Build up to 3 outfits, with NO duplicates.
  LOGIC: 1) Combine the required bins with the checked accessory bins.
         2) Aim for 3 outfits, or fewer if the closet can't make 3 different ones.
         3) Keep building outfits. Keep a new one only if its fingerprint hasn't been seen.
         4) Stop when we have enough, or after MAX_TRIES tries (the safety limit).
  WHY WE NEED IT: Card "Shuffles picks 3 outfits." Repeated outfits look like a glitch.
  LEARNING GAP: A Set is a list that never holds the same value twice. seen.has(key)
         asks "is this fingerprint already in the Set?" The spread (...) joins two lists into one.
  WHERE THE DATA COMES FROM: The saved closet (getCloset) and the checked pills.
*/
export function buildOutfits(accessoryBins) {
    const items = getCloset();
    const bins = [...REQUIRED_BINS, ...accessoryBins];
    const target = Math.min(OUTFIT_COUNT, countPossibleOutfits(items, bins));

    const outfits = [];
    const seen = new Set();
    let tries = 0;

    while (outfits.length < target && tries < MAX_TRIES) {
        const outfit = buildOneOutfit(items, bins);
        const key = outfitKey(outfit);

        if (!seen.has(key)) {
            seen.add(key);
            outfits.push(outfit);
        }

        tries++;
    }

    return outfits;
}

/*
  PLAIN ENGLISH: Show the outfits on the page as cards.
  LOGIC: Clear the area, then for each outfit make a card with a title ("Outfit 1"),
         the coloring-book drawing, and a list of pieces: a color circle, the bin name,
         and the color code. If there are fewer than 3 outfits, add a short note explaining why.
  WHY WE NEED IT: The user SEES their outfits, first as a picture, then as exact colors.
  LEARNING GAP: We use textContent, not innerHTML, for text. It's safer, the same as renderCloset.
         The color circle reuses your .swatch class from the closet page, so no new CSS is needed for it.
         drawOutfit lives in its own file (outfit-drawing.mjs). This function just places the picture.
  WHERE THE DATA COMES FROM: The outfits made by buildOutfits.
*/
export function renderOutfits(container, outfits) {
    container.innerHTML = "";

    outfits.forEach((outfit, index) => {
        const card = document.createElement("article");
        card.className = "outfit-card";

        const heading = document.createElement("h3");
        heading.textContent = `Outfit ${index + 1}`;
        card.appendChild(heading);

        /*
          PLAIN ENGLISH: Add the coloring-book drawing under the "Outfit 1" title.
          LOGIC: drawOutfit builds the picture from this outfit's colors and hands it back.
                 appendChild puts it in the card BEFORE the list, so the picture comes first.
          WHY WE NEED IT: Card "Draw coloring book outfit."
          LEARNING GAP: Order matters. Whatever is appended first shows higher on the card.
        */
        card.appendChild(drawOutfit(outfit));

        const list = document.createElement("ul");
        list.className = "outfit-pieces";

        outfit.forEach((item) => {
            const li = document.createElement("li");

            const swatch = document.createElement("span");
            swatch.className = "swatch";
            swatch.style.backgroundColor = item.color;

            const binName = document.createElement("span");
            binName.className = "piece-bin";
            binName.textContent = item.bin;

            const colorCode = document.createElement("span");
            colorCode.className = "piece-color";
            colorCode.textContent = item.color;

            li.append(swatch, binName, colorCode);
            list.appendChild(li);
        });

        card.appendChild(list);
        container.appendChild(card);
    });

    /*
      PLAIN ENGLISH: If the closet could only make 1 or 2 different outfits, explain why.
      LOGIC: Compare how many outfits we made to OUTFIT_COUNT (3).
             The word changes: "1 different outfit is" vs "2 different outfits are."
      WHY WE NEED IT: Without a note, fewer than 3 cards could look like a bug.
      LEARNING GAP: The ? : is a short if/else (called a "ternary"):
             condition ? valueIfTrue : valueIfFalse.
    */
    if (outfits.length < OUTFIT_COUNT) {
        const note = document.createElement("p");
        note.className = "outfit-note";
        const words = outfits.length === 1 ? "different outfit is" : "different outfits are";
        note.textContent = `Only ${outfits.length} ${words} possible right now. Add more clothes for more variety.`;
        container.appendChild(note);
    }
}

/*
  PLAIN ENGLISH: Show a friendly message when the closet is missing tops, bottoms, or shoes.
  LOGIC: Clear the area, then show which bins need clothes and a link to My Closet.
  WHY WE NEED IT: A helpful message instead of a broken or empty outfit.
  LEARNING GAP: join(", ") turns ["Tops", "Shoes"] into the text "Tops, Shoes".
         The message uses the .empty class, so it gets the same calm box style.
*/
export function renderMissingMessage(container, missingBins) {
    container.innerHTML = "";

    const message = document.createElement("p");
    message.className = "empty";
    message.textContent = `Add at least one item to: ${missingBins.join(", ")}. `;

    const link = document.createElement("a");
    link.href = "index.html";
    link.textContent = "Go to My Closet";

    message.appendChild(link);
    container.appendChild(message);
}