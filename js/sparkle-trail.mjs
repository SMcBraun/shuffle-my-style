/*
  PLAIN ENGLISH: Makes little sparkles follow the mouse, like magic dust from the wand cursor.
  LOGIC: Every time the mouse moves, we make one tiny star (a <span>), place it where the mouse is,
         let CSS fade it away, and then delete it.
  WHY WE NEED IT: Trello card "Polish: Magic wand cursor + sparkle trail." It makes the app feel
         magical, like a fairy godmother putting outfits together.
  LEARNING GAP: The sparkles are only decoration. They never block clicks, and screen readers skip them.
  WHERE THE DATA COMES FROM: The mouse position. The browser sends it with every "mousemove" event.
*/

/*
  PLAIN ENGLISH: The choices for each sparkle: 3 app colors and 3 star shapes.
  LOGIC: Each name matches a CSS class in style.css (.trail-coral, .trail-turquoise, .trail-sunny).
  WHY WE NEED IT: A mix of colors and shapes looks more magical than one repeated star.
  LEARNING GAP: The real colors live in style.css (the :root variables). JavaScript only picks the class name.
*/
const COLORS = ["coral", "turquoise", "sunny"];
const SHAPES = ["✦", "✧", "⋆"];

/*
  PLAIN ENGLISH: Wait at least 40 milliseconds between sparkles.
  LOGIC: The mouse can fire "mousemove" over 100 times a second. We skip the extra ones.
  WHY WE NEED IT: Too many sparkles at once would slow the page down.
  LEARNING GAP: 1,000 milliseconds = 1 second, so 40 milliseconds allows about 25 sparkles a second.
*/
const WAIT_MS = 40;
let lastSparkleTime = 0;

/*
  PLAIN ENGLISH: Pick one random item from a list.
  LOGIC: Math.random() gives a number from 0 up to (but not including) 1. Multiply by the list's
         length and round down with Math.floor to get a spot number: 0, 1, or 2.
  WHY WE NEED IT: Each sparkle gets a surprise color and shape.
  LEARNING GAP: List spots start at 0, not 1, so a list of 3 has spots 0, 1, and 2.
*/
function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/*
  PLAIN ENGLISH: Make one sparkle at the mouse's spot, and remove it when its animation ends.
  LOGIC: createElement makes a <span>. We give it a color class, a star shape, and its position.
         style.css plays the "trail-fade" animation. When it ends, "animationend" fires and we delete it.
  WHY WE NEED IT: Without deleting them, thousands of old sparkles would pile up on the page.
  LEARNING GAP: aria-hidden="true" tells screen readers to skip the sparkle, because it's only
         decoration. We use textContent (not innerHTML), the same safe habit as closet.mjs.
*/
function makeSparkle(x, y) {
    const sparkle = document.createElement("span");
    sparkle.className = `trail-sparkle trail-${pickRandom(COLORS)}`;
    sparkle.textContent = pickRandom(SHAPES);
    sparkle.setAttribute("aria-hidden", "true");
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;

    sparkle.addEventListener("animationend", () => {
        sparkle.remove();
    });

    document.body.appendChild(sparkle);
}

/*
  PLAIN ENGLISH: Turn on the sparkle trail, but only for mouse users who are okay with motion.
  LOGIC: matchMedia asks the browser two questions:
         1. Did the user turn on "reduce motion" in their device settings?
         2. Is there a mouse ("pointer: fine")? Phones and tablets use a finger ("coarse").
         If motion is reduced or there's no mouse, we stop (return) and add no sparkles.
         Otherwise, we listen for "mousemove" on the whole page.
  WHY WE NEED IT: Respects users who get dizzy from motion, the same rule as the card-pop animation.
         Phones have no mouse to follow.
  LEARNING GAP: clientX and clientY are the mouse's spot in the visible window. That's why the CSS
         uses position: fixed. The sparkle stays where the mouse is, even after scrolling.
  WHERE THE DATA COMES FROM: The browser's settings (matchMedia) and the mouse (the event object).
*/
function startSparkleTrail() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasMouse = window.matchMedia("(pointer: fine)").matches;

    if (reduceMotion || !hasMouse) {
        return;
    }

    document.addEventListener("mousemove", (event) => {
        const now = Date.now();
        if (now - lastSparkleTime < WAIT_MS) {
            return;
        }
        lastSparkleTime = now;
        makeSparkle(event.clientX, event.clientY);
    });
}

startSparkleTrail();