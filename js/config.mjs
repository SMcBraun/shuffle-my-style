/*
  PLAIN ENGLISH: The app's Unsplash key, kept in its own small file.
  LOGIC: export lets unsplash-api.mjs import the key with one line.
  WHY WE NEED IT: Card "Get Unsplash key." Unsplash needs this key on every photo request
         so it knows which app is asking.
  LEARNING GAP: This is the ACCESS key, never the Secret key. Because this is a front-end app
         on GitHub Pages, anyone who opens the code can see this key. That's normal for small
         class projects in Unsplash's free Demo mode (about 50 requests per hour).
         After the course is graded, you can make a new key on unsplash.com/developers
         (or delete the app), and this one stops working.
         Keeping it in ONE file means a new key is a one-line change.
  WHERE THE DATA COMES FROM: Your app page on unsplash.com/developers (the "Keys" section).
*/
export const UNSPLASH_ACCESS_KEY = "2fDqtl8_0S4MQRl0GIybHYX5mN6ZhPmkmBoItFKE2gQ";