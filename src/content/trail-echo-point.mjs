// The short trail header for the Echo Point page (/trails/echo-point/). The rest of the page is the existing `echo`
// block in src/content.mjs, and the status box shows the trail table's row word for word.
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with no
// alternate keeps the most recent one. Each stage agrees with that stage's `echo` heading: 0 to 2 'How the echo
// works', 3 'No shouting at Echo Point', 4 'Echo Point is closed', 5 'Nobody is shouting up there', 6 "It's using
// your voice now".
export const trailEchoPoint = {
  titles: [
    'Echo Point | Echo Basin National Park',
    'Echo Point | Echo Basin National Park',
    'Echo Point: Count the Echoes | Echo Basin National Park',
    'Echo Point: No Shouting | Echo Basin National Park',
    'Echo Point | Echo Basin',
    'Echo Point | Echo Basin',
    "Don't turn around",
  ],
  name: 'Echo Point',
  facts: [
    ['Start', 'Basin Lodge trailhead'],
    ['Terrain', 'Short and steep, through the trees to a rail at the top.'],
  ],
  intro: ["The shortest trail in the park, and the one almost everybody does. It climbs 790 feet through the trees from the lodge to a bluff at 4,330 feet with a rail along the edge. It's steep, but you're back in about an hour.", {
    2: "The shortest trail in the park, and the one almost everybody does. It's steep, but you're back in about an hour. While you're at the rail, count the echoes. You should hear four.",
    3: "There's no shouting from the rail until further notice. It's still about an hour there and back, and the trail closes at dusk.",
    4: 'Closed since Sept. 14. That afternoon the fifth echo came from the trees beside this trail, about 700 feet short of the rail.',
    5: "Closed. There's nobody on the trail.",
    6: "You're already at the rail.",
  }],
  mapCap: ['Echo Point, trail 3 on the park map, from the lodge up to the rail.', {
    4: 'Park map, reprinted Sept. 16. Trail 3 is crossed out.',
  }],
};
