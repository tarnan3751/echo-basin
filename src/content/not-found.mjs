// Copy for the page shown at any address that does not exist. Story bible section 12, "Not found".
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a
// stage with no alternate keeps the most recent one. An empty string means the line is not shown.
// The link goes to the trail map at every stage. Its words are the hero link's, stage for stage.
// `sign` is the words routed into the trail sign in the picture: `board` is the main board, `hung` the
// smaller board hung beneath it, as on the Cathedral Stand trailhead sign. At stage 6 there is no hung
// board. `alt` describes the picture.
export const notFound = {
  titles: [
    'Page Not Found | Echo Basin National Park',
    'Page Not Found | Echo Basin National Park',
    'Not on the Map | Echo Basin National Park',
    'Go Back the Way You Came | Echo Basin National Park',
    'Not Found | Echo Basin',
    'Not Found | Echo Basin',
    "Don't turn around",
  ],
  h1: ["That trail isn't on the map", { 3: 'Go back the way you came', 6: "Don't turn around" }],
  body: ["We couldn't find a page at that address. It may have moved, or there may be a typo in the link. The trail map is a good place to start.", {
    1: "We couldn't find a page at that address. It may have moved, or there may be a typo in the link. The trail map is the safest place to start.",
    3: "There's nothing at this address. Please stay on the marked trails.",
    6: 'It came the same way you did.',
  }],
  link: ['See the trail map', { 4: 'See the reprinted map', 6: 'See which way it went' }],
  sign: {
    board: ['End of trail', { 6: "Don't turn around" }],
    hung: ['Not on the map', { 3: 'Go back', 6: '' }],
  },
  alt: ['A wooden trail sign on two posts, standing by itself in the mist. The sign reads "End of trail." A smaller board hung under it reads "Not on the map."', {
    3: 'A wooden trail sign on two posts, standing by itself in the mist. The sign reads "End of trail." A smaller board hung under it reads "Go back."',
    6: 'A wooden trail sign on two posts, standing by itself in the mist. The sign reads "Don\'t turn around."',
  }],
};
