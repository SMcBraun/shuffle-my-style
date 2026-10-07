/*
  PLAIN ENGLISH: This file draws the "coloring book" picture of an outfit.
         It draws a simple person and colors each piece with the user's own clothing colors.
  LOGIC: The picture is an SVG (shapes written in code). JavaScript builds each shape,
         then fills it with the color of the matching item from the outfit.
  WHY WE NEED IT: Card "Draw coloring book outfit." Seeing the outfit is easier and more
         inspiring than reading color codes. This is what the proposal promised.
  LEARNING GAP: This file ONLY draws. It doesn't pick clothes (shuffle.mjs does that) or
         save anything (storage.mjs does that). One job per file keeps the code easy to find.
  WHERE THE DATA COMES FROM: One outfit from buildOutfits in shuffle.mjs. Each item has a
         bin (like "Tops") and a color (like "#ff6f61") that the user picked on the closet page.
*/

/*
  PLAIN ENGLISH: Three settings used by every drawing.
  LOGIC: SVG_NS is the SVG "address" the browser needs. LINE is the outline color (charcoal,
         the same as --dark in style.css). PAPER is white for skin, like an uncolored coloring page.
  WHY WE NEED IT: Stored once, so a change happens in ONE place, the same idea as CSS variables.
  LEARNING GAP: SVG shapes MUST be made with createElementNS and this address. A plain
         createElement("circle") makes a shape the browser never draws, with no error message.
*/
const SVG_NS = "http://www.w3.org/2000/svg";
const LINE = "#2b2b2b";
const PAPER = "#ffffff";

/*
  PLAIN ENGLISH: The outlines of each clothing piece, written as SVG "paths."
  LOGIC: A path is drawing directions: M = move the pen here, L = draw a line to here,
         Q = draw a curve, Z = close the shape. The numbers are x (across) and y (down)
         on a 120 by 200 grid.
  WHY WE NEED IT: Keeping the shapes here, apart from the coloring code, makes them easy to adjust.
  LEARNING GAP: In SVG, y gets BIGGER going DOWN the page, not up like in math class.
         So the hat (y around 3) is at the top and the shoes (y around 182) are at the bottom.
*/
const SHAPES = {
    leftArm: "M31 68 L24 108 L31 109 L38 73 Z",
    rightArm: "M89 68 L96 108 L89 109 L82 73 Z",
    leftLeg: "M47 146 L49 179 L56 179 L57 146 Z",
    rightLeg: "M63 146 L64 179 L71 179 L73 146 Z",
    top: "M44 50 L54 50 Q60 57 66 50 L76 50 L90 66 L82 72 L76 64 L76 102 L44 102 L44 64 L38 72 L30 66 Z",
    skirt: "M45 98 L75 98 L92 146 L28 146 Z",
    hatCrown: "M48 17 Q48 3 60 3 Q72 3 72 17 Z",
    bagHandle: "M94 110 Q102 96 110 110",
    necklace: "M53 51 Q60 63 67 51",
};

/*
  PLAIN ENGLISH: Make one SVG shape and give it its settings.
  LOGIC: createElementNS makes the shape. Object.entries turns { cx: 60, r: 13 } into pairs
         like ["cx", 60], and setAttribute adds each pair to the shape.
  WHY WE NEED IT: Every shape needs this, so one helper saves writing the same lines 15 times.
  LEARNING GAP: setAttribute is safe, like textContent. The color is set as a value, never
         run as code, so a strange saved value can't break the page.
*/
function makeShape(tag, attributes) {
    const shape = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => {
        shape.setAttribute(name, value);
    });
    return shape;
}

/*
  PLAIN ENGLISH: Find the color of the item from one bin, like the Tops color.
  LOGIC: find() returns the FIRST item whose bin matches, or undefined if there is none.
  WHY WE NEED IT: Each shape gets colored by its bin: the shirt by Tops, the skirt by Bottoms.
  LEARNING GAP: Returning null for "not in this outfit" lets drawOutfit skip accessories
         the user didn't check. find() gives ONE item; filter() would give a list.
*/
function colorOf(outfit, bin) {
    const item = outfit.find((piece) => piece.bin === bin);
    return item ? item.color : null;
}

/*
  PLAIN ENGLISH: Draw the whole outfit and hand back the finished picture.
  LOGIC: 1) Make the SVG "canvas" (120 wide by 200 tall).
         2) Make a group (g) that gives every shape the same charcoal outline.
         3) Draw back to front: arms, legs, neck, and head first, then the skirt, top,
            and shoes on top of them, then any accessories last.
         4) Hat, bag, and accent are drawn ONLY if the outfit has one.
  WHY WE NEED IT: renderOutfits in shuffle.mjs calls this once per outfit card.
  LEARNING GAP: SVG has no "z-index." Whatever is drawn LATER sits on top. That's why the
         top is drawn after the skirt: its hem covers the skirt's waist, like tucking in a shirt.
         aria-hidden="true" hides the drawing from screen readers, because the list below it
         already says the same thing in words. Reading both would repeat everything.
  WHERE THE DATA COMES FROM: The outfit passed in by renderOutfits.
*/
export function drawOutfit(outfit) {
    const svg = makeShape("svg", {
        viewBox: "0 0 120 200",
        class: "outfit-drawing",
        "aria-hidden": "true",
        focusable: "false",
    });

    const group = makeShape("g", {
        stroke: LINE,
        "stroke-width": "2",
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
    });
    svg.appendChild(group);

    const add = (tag, attributes) => group.appendChild(makeShape(tag, attributes));

    // Skin: the uncolored parts of the coloring page.
    add("path", { d: SHAPES.leftArm, fill: PAPER });
    add("path", { d: SHAPES.rightArm, fill: PAPER });
    add("path", { d: SHAPES.leftLeg, fill: PAPER });
    add("path", { d: SHAPES.rightLeg, fill: PAPER });
    add("rect", { x: 55, y: 38, width: 10, height: 18, fill: PAPER });
    add("circle", { cx: 60, cy: 28, r: 13, fill: PAPER });

    // Clothes: every outfit has these three (REQUIRED_BINS in shuffle.mjs).
    add("path", { d: SHAPES.skirt, fill: colorOf(outfit, "Bottoms") });
    add("path", { d: SHAPES.top, fill: colorOf(outfit, "Tops") });
    add("ellipse", { cx: 49, cy: 183, rx: 9, ry: 5, fill: colorOf(outfit, "Shoes") });
    add("ellipse", { cx: 71, cy: 183, rx: 9, ry: 5, fill: colorOf(outfit, "Shoes") });

    // Accessories: drawn only when the user checked that pill AND has one in the closet.
    const hat = colorOf(outfit, "Hats");
    if (hat) {
        add("path", { d: SHAPES.hatCrown, fill: hat });
        add("ellipse", { cx: 60, cy: 17, rx: 24, ry: 5, fill: hat });
    }

    const bag = colorOf(outfit, "Bags");
    if (bag) {
        add("path", { d: SHAPES.bagHandle, fill: "none" });
        add("rect", { x: 90, y: 108, width: 24, height: 18, rx: 4, fill: bag });
    }

    const accent = colorOf(outfit, "Accents");
    if (accent) {
        add("path", { d: SHAPES.necklace, fill: "none", stroke: accent, "stroke-width": "3" });
        add("circle", { cx: 60, cy: 60, r: 3.5, fill: accent, "stroke-width": "1.5" });
    }

    return svg;
}