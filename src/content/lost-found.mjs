// Copy for the Lost and found page (/lost-and-found/). Story bible section 12, "Lost and found".
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a
// stage with no alternate keeps the most recent one. An empty string means the line is not shown.
// The heading follows the footer link: "Lost and found", then "Lost" at stage 4, "Found" at stage 5.
// Tags are the board. Each has what the item is, where it was found, the date, and sometimes a line in
// pen. `from` and `until` are the first and last stages a tag is on the board (absent means always).
// Order is the order on the board: newest first, except the three stage 5 tags, which run in the order
// they happened. At stage 5 `where` carries the light or the look it was found by, not a place.
// The stage 6 tag uses the reader's own date and time: {date} as "Nov. 26", {time} as "11:40 pm".
export const lostFound = {
  titles: [
    'Lost and Found | Echo Basin National Park',
    'Lost and Found | Echo Basin National Park',
    'Lost and Found: Rental Canoe | Echo Basin National Park',
    'Lost and Found: Paper Maps | Echo Basin National Park',
    'Lost | Echo Basin',
    'Found | Echo Basin',
    "Don't turn around",
  ],
  h1: ['Lost and found', { 4: 'Lost', 5: 'Found' }],
  intro: ["Here's what has been handed in this summer at the lodge and both entrance stations. If yours isn't here, ask anyway, because not everything makes it onto the board.", {
    1: "Here's what has been left behind this summer at the lodge and both entrance stations. If yours isn't here, ask anyway, because not everything makes it onto the board.",
    2: "Here's what has been handed in this summer at the lodge and both entrance stations. If you know who had the rental canoe out, please tell the front desk.",
    3: "Please hand in any paper map with a straight line on it that isn't on ours. Don't go back after dusk for anything you dropped.",
    4: 'We know who most of these belong to.',
    5: 'We took the other tags down.',
    6: '',
  }],
  claim: ["Pick things up at the lodge front desk at any time. If you've already gone home, call the ranger line at 555-0142, 6 am to 8 pm, and we'll mail it to you.", {
    1: "Pick things up at the lodge front desk at any hour. If you've already gone home, call the ranger line at 555-0142, 6 am to 8 pm, and we'll mail it to you.",
    2: "Pick things up at the lodge front desk before the gate locks at 7:42. If you've already gone home, call the ranger line at 555-0142, 6 am to 8 pm, and we'll mail it to you.",
    3: "Pick things up at the lodge front desk before 7:42 pm. If you've already gone home, call the ranger line at 555-0142, daylight only, and we'll mail it to you.",
    4: "To claim something, call the ranger line before dark: 555-0142. The front desk isn't answering.",
    5: "Don't call about these.",
    6: '',
  }],
  tags: [
    // Stage 6: the reader.
    { item: 'You', where: 'Reading this', date: '{date}, {time}', pen: 'still here', from: 6 },

    // Stage 5: what it has found, each by a light or a look. In the order it happened.
    { item: 'Pass Hut', where: 'Lamp on in the window', date: 'Sept. 15', from: 5, until: 5 },
    { item: 'Cabin 3', where: 'Guest looked out', date: 'Sept. 15', from: 5, until: 5 },
    { item: 'Basin Lodge', where: 'Lights on, lake side', date: 'Sept. 15', from: 5, until: 5 },

    // Stage 4: the objects in the site's pictures.
    { item: 'Three ranger hats', where: 'Cathedral Stand trailhead, on the boards', date: 'Sept. 16', pen: 'Tomás, June, Sam', from: 4, until: 4 },
    { item: 'Camp mug', where: 'Cathedral Stand trailhead', date: 'Sept. 16', pen: "Tomás's", from: 4, until: 4 },
    { item: 'Clipboard', where: 'Cathedral Stand trailhead', date: 'Sept. 16', pen: "June's", from: 4, until: 4 },
    { item: 'Snowshoes, two pairs, and poles', where: 'Outside the Pass Hut', date: 'Sept. 15', pen: 'from the star talk, still up there', from: 4, until: 4 },
    { item: 'Pack with a bedroll, one pole', where: 'Cathedral Stand boardwalk', date: 'Sept. 14', pen: 'M. Arroyo, still on the boardwalk', from: 4, until: 4 },

    // Stage 3: maps handed in on the 13th.
    { item: 'Paper park maps with a straight line on them', where: 'Handed in by visitors', date: 'Sept. 13', pen: 'keep these', from: 3, until: 4 },

    // Stage 2: the canoe.
    { item: 'Rental canoe, no paddle', where: 'Adrift on Echo Lake, nobody in it', date: 'Sept. 11', pen: ['not on the rental sheet', { 4: 'still out there' }], from: 2, until: 4 },

    // Stage 0: the summer board. Two stay up through stage 4.
    { item: 'Paperback, about half read', where: 'Lodge porch', date: 'Sept. 10', until: 4 },
    { item: 'Reading glasses', where: 'Lodge lounge', date: 'Sept. 8', until: 3 },
    { item: 'Binoculars in a case', where: 'Halloran Meadows', date: 'Sept. 6', until: 3 },
    { item: 'Water bottle, steel', where: 'Echo Point trail', date: 'Sept. 3', until: 3 },
    { item: 'House keys on a red carabiner', where: 'Lodge parking lot', date: 'Aug. 29', pen: 'still here', until: 4 },
    { item: "Kid's fleece jacket, green", where: 'Cedar Flats, by a water tap', date: 'Aug. 25', until: 3 },
    { item: 'Thermos, dented', where: 'Pass Hut', date: 'Aug. 21', until: 3 },
    { item: 'Water bottle, blue, covered in stickers', where: 'Lakeshore Loop', date: 'Aug. 18', until: 3 },
    { item: 'Stuffed bear, well loved', where: 'Lodge dock', date: 'July 27', pen: 'claimed', until: 2 },
    { item: 'Sunglasses, tortoiseshell', where: 'Echo Point, on the rail', date: 'July 22', pen: 'claimed', until: 1 },
  ],
  note: ['Updated most mornings by the lodge front desk.', { 4: 'Last updated Sept. 16.', 5: 'No longer updated.', 6: 'Updated just now.' }],
};
