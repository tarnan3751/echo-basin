// All copy for Echo Basin. Each entry is either a string or [base, { stage: alternate }].
// Voice: a small park authority's website. Plain, practical, a little chatty. The later stages keep
// that voice and change what it is reporting. Ladder: 1 word choice only, 2 odd but deniable,
// 3 instructions, 4 wrong, 5 hostile, 6 direct address. A stage with no alternate keeps the last one.
export const C = {
  titles: [
    'Echo Basin National Park | Plan Your Visit',
    'Echo Basin National Park | Plan Your Stay',
    'Echo Basin National Park | Quiet Hours Now Start at Dusk',
    'Echo Basin National Park | Please Do Not Call Out',
    'Echo Basin | Conditions Advisory Tonight',
    'Echo Basin | You Answered It',
    "Don't turn around",
  ],
  brand: ['Echo Basin', { 6: 'Not an echo' }],
  brandSub: ['National Park', { 6: '' }],
  cta: ['Plan your visit', { 1: 'Plan your stay', 3: 'Check conditions', 5: 'Do not visit', 6: "Don't turn around" }],
  nav: [
    ['explore/', ['Explore', { 6: 'It' }]],
    ['trails/', ['Trails', { 3: 'Trails (day use)', 6: 'is' }]],
    ['wildlife/', ['Wildlife', { 4: 'Wildlife (none)', 6: 'behind' }]],
    ['safety/', ['Safety', { 3: 'Alerts', 6: 'you' }]],
    ['lodging/', ['Lodging', { 5: 'Lodging (closed)', 6: 'now' }]],
  ],
  ticker: [
    ['Lakeshore Rd open. Short delays for paving near mile 4.', { 2: 'Lakeshore Rd open until dusk. Gate locks at 7:42.', 4: 'Lakeshore Rd closed past the boat launch, staff vehicles only', 5: "Lakeshore Rd: don't. It isn't a way out." }],
    ['Cedar Flats Campground is 82% full this weekend', { 3: 'Cedar Flats: everyone in tents by 7:42 pm, no exceptions', 4: "Cedar Flats is empty. Please don't go looking.", 6: "Cedar Flats wasn't empty when you looked at the map" }],
    ['Sunset tonight 7:42 pm', { 1: 'Dusk tonight 7:42 pm', 3: 'Be indoors by 7:42 pm', 5: "It's after 7:42" }],
    ['Current conditions: good', { 1: 'Current conditions: fair', 2: 'Conditions: quiet. Help us keep it that way.', 3: 'Conditions last reported near Echo Pass, heading downhill', 4: 'CONDITIONS ADVISORY tonight for the whole basin', 5: 'Conditions are at the lodge', 6: 'Conditions have left the park' }],
    ['Fire danger: moderate. Campfires in rings only.', { 3: 'No campfires. No lanterns or headlamps outside after dusk.', 5: 'No lights' }],
    ['Pass Hut staffed daily through Sept. 30', { 3: 'Pass Hut is not staffed after dark', 4: 'Pass Hut: door found open 9/15. Do not go in.', 6: "Nobody's at the hut" }],
  ],
  hero: {
    kick: ['Welcome to Echo Basin National Park', { 4: 'Notice to visitors, updated Sept. 16', 6: 'Echo Basin' }],
    h1: ['Where the mountains answer back', { 1: 'Where the basin answers back', 2: 'Where something answers back', 3: 'Please do not call out', 4: 'It answers whether you call or not', 5: "You shouldn't have called out", 6: 'It heard you' }],
    sub: ["Echo Basin is 186,000 acres of glacier lake, old-growth cedar and high country, about two and a half hours from the city. We're open all year. Most people come for the lake. Almost everybody ends up yelling at the mountains from Echo Point, because they yell back.", {
      1: 'Echo Basin is 186,000 acres of glacier lake, old-growth cedar and high country, about two and a half hours from the city. We never close. Most people come for the lake. Almost everybody ends up calling to the mountains from Echo Point, because they answer.',
      2: "Most people come for the lake. Almost everybody ends up yelling at the mountains from Echo Point, because they yell back. You should hear four echoes. If you hear five, please tell a ranger. We're keeping a list.",
      3: "Until further notice, please don't shout, sing or whistle anywhere in the park. If you hear a voice from off the trail, even one you know, don't answer it. Walk to the nearest building and tell staff.",
      4: "Since about the 12th the echo has been coming back with the wrong words. Since the 14th it's been coming back before anybody calls. Echo Point is closed.",
      5: "We asked you not to call out. It's posted at every trailhead and it's been at the top of this page since the 13th.",
      6: "You've been sounding these words out in your head as you read. That turned out to be enough. It's been reading along since you got here.",
    }],
    link: ['See the trail map', { 4: 'See the reprinted map', 6: 'See which way it went' }],
    cap: ['Echo Lake and Basin Lodge from the south shore, last September.', {
      2: 'Echo Lake from the south shore. If you know who took the rental canoe out and left it, please call the lodge.',
      3: 'Echo Lake from the south shore. The treetops behind the lodge came down overnight on the 12th, all at about the same height.',
      4: "Echo Lake from the south shore. Yes, we know about the reflection. Please stop emailing us photos of it.",
      5: "Echo Lake. Don't look at the water any longer than you have to.",
      6: "Echo Lake. It isn't in the water anymore.",
    }],
  },
  glance: [
    ['Open', ['All year, 24 hours', { 1: 'All year, all hours', 2: 'Daily, dawn to dusk', 3: 'Daylight hours only', 5: 'Closed to the public' }]],
    ['Entrance fee', ['$30 per vehicle, good for 7 days', { 4: '$30 per vehicle. No charge to leave.', 5: 'Waived' }]],
    ['Tallest tree', ['259 ft Douglas fir, Cathedral Stand', { 3: '259 ft Douglas fir (top section lost Sept. 12)', 4: 'Not the tallest thing in the park anymore' }]],
    ['Visitors last year', ['412,000', { 1: '412,000 admitted', 2: '412,000 in', 4: '412,000. This September, 6 unaccounted for.', 6: 'You make 412,001' }]],
  ],
  zones: {
    h2: ['Four landscapes, one park', { 3: 'Four landscapes, three open', 4: 'Four landscapes, none open', 5: 'It came down through all four', 6: 'Then it came to you' }],
    intro: ["The park climbs more than 5,000 feet in eleven miles, so you can paddle the lake in the morning and be standing in snow by lunch. Here's what you pass on the way up.", {
      2: "The park climbs more than 5,000 feet in eleven miles, so you can paddle the lake in the morning and be standing in snow by lunch. Just give yourself time to get back down before dusk.",
      4: 'The park drops more than 5,000 feet in eleven miles. Whatever came over the pass covered that in one night, in a straight line.',
    }],
    items: [
      { alt: '8,560 ft', name: 'Echo Pass', body: ["Snow most of the year, and a warming hut that's staffed all summer. The view from the top is the one on the postcards. On the way up, stop at Echo Point and give it a yell. Four echoes is normal.", {
        1: "Snow most of the year, and a warming hut that's occupied all summer. The view from the top is the one on the postcards. On the way up, stop at Echo Point and call to it. Four answers is normal.",
        2: 'On the way up, stop at Echo Point and give it a yell. Four echoes is normal. A few people this month have counted five, and two of them swear the last one said something different.',
        3: "Echo Point is closed to shouting until further notice. If you hear your name from up in the snow, that isn't a ranger. Rangers don't know your name. Keep walking downhill.",
        4: "The fifth echo now comes back before the other four. We don't have an explanation we're comfortable putting on a website.",
        5: "It was using Tomás's voice at the hut on the 15th. It's had a few days to practice since then.",
        6: 'If you can hear somebody reading this out loud right now, check whether your mouth is moving.',
      }] },
      { alt: '6,230 ft', name: 'Halloran Meadows', body: ["Wildflowers peak in July. Elk graze here most evenings, so bring binoculars and keep your distance. It's also the only spot in the park where you can see the lake and the pass at the same time.", {
        1: "Wildflowers peak in July. Elk gather here most evenings, so bring binoculars and keep your distance. It's also the only spot in the park with a clear sightline to both the lake and the pass.",
        2: "Elk graze here most evenings, although lately they mostly stand and watch the trees on the east side. Nobody's figured out what they're watching.",
        3: "If the elk all leave at once, you leave too, the same direction they went. Please don't hang around to see what spooked them.",
        4: "No elk have been counted since September 14. There's a track through the flowers that we didn't cut.",
        5: "The track runs dead straight from the pass to the lake. If you're in the meadow you're probably standing on it.",
      }] },
      { alt: '4,270 ft', name: 'Cathedral Stand', body: ["Old-growth cedar and Douglas fir, some of it more than 600 years old. The boardwalk loop is flat and wheelchair accessible. Please stay on it, because the roots are shallower than they look.", {
        1: "Old-growth cedar and Douglas fir, some of it more than 600 years old. The boardwalk loop is flat and wheelchair accessible. Please stay on it, where you can be seen.",
        2: "You might notice bark missing from some of the trunks about forty feet up. Our forester says wind. It's at the same height on every tree, which she admits is strange for wind.",
        3: "After 5 pm please keep your eyes on the boardwalk. Don't look up into the canopy, and don't shine a flashlight up there either.",
        4: "Every trunk in the stand is marked at forty feet now, and we don't have an animal in this park that stands forty feet tall.",
        5: "It's taller than forty feet. Forty feet is about where its shoulders are when it ducks under the branches.",
      }] },
      { alt: '3,540 ft', name: 'Echo Lake', body: ["Eleven miles long and cold enough to make you yelp. On calm mornings it's a mirror. Canoes and kayaks rent by the hour at the lodge dock, life jackets included.", {
        1: "Eleven miles long and cold all the way down. On calm mornings it's a mirror. Canoes and kayaks are signed out by the hour at the lodge dock, life jackets included.",
        2: "On calm mornings it's a mirror. A few guests have told us the reflection doesn't always match the shoreline. It's probably the light, but we'd like to hear about it if you see it.",
        3: "Please don't stare at the reflection. If you see something in the water that isn't on the shore, look somewhere else and tell staff when you get in.",
        4: "The thing you can see in the reflection, standing in the trees, is really there. You can't see it by looking at the trees. We've tried.",
        5: 'You looked at the picture of the lake for a long time.',
      }] },
    ],
    capA: ["Cathedral Stand boardwalk. That's a full-grown adult on the trail.", { 3: 'Cathedral Stand. The pale patches are the marks. Forty feet up, every tree.', 4: 'Cathedral Stand. The pack belongs to M. Arroyo, who signed in on the 14th.', 5: "Cathedral Stand. There's something orange near the top of the picture. We haven't been able to get it down." }],
    capB: ['Pass Hut, about a mile below Echo Pass.', { 3: "Pass Hut. The holes are forty feet apart and we don't know what made them.", 4: 'Pass Hut on the morning of the 15th. The door was open and the stove was still warm.', 5: 'They come down past the hut and keep going. Follow them and you end up at the lodge.' }],
  },
  trails: {
    h2: ['Day hikes', { 3: 'Day hikes (daylight only)', 4: 'Day hike', 5: "It doesn't use the trails", 6: "It didn't need a trail to find you" }],
    intro: ["Five maintained trails, from a flat stroll along the lake to a full day in the snow. Mileage is round trip. Grab a paper map at either entrance station, because your phone won't work past the lodge.", {
      2: "Five maintained trails, from a flat stroll along the lake to a full day in the snow. Mileage is round trip. Grab a paper map at either entrance station, and please stick to the route it shows.",
      3: "All trails close at dusk, and we mean it. Rangers sweep at 6 pm. If your paper map has a straight line on it that isn't on this one, hand it in.",
      4: 'One trail is open. The paper map was reprinted this week. Staff will swap your old one, no questions asked.',
    }],
    rows: [
      ['1', 'Lakeshore Loop', '4.2 mi', '200 ft', '2 hr', ['Open', { 3: 'Open until dusk', 4: "Open. Don't step off it.", 5: 'In use (not by visitors)' }]],
      ['2', 'Cathedral Stand', '2.8 mi', '300 ft', '1.5 hr', ['Open', { 2: 'Open, boardwalk only', 3: 'Closes at 5 pm', 4: 'Closed' }]],
      ['3', 'Echo Point', '1.1 mi', '790 ft', '1 hr', ['Open', { 3: 'Open, no shouting', 4: 'Closed' }]],
      ['4', 'Halloran Meadows', '6.4 mi', '2,690 ft', '5 hr', ['Open', { 3: 'Open in daylight', 4: 'Closed' }]],
      ['5', 'Echo Pass', '11.8 mi', '5,020 ft', '9 hr', ['Snow above 7,500 ft', { 2: 'Snow above 7,500 ft. Unidentified tracks.', 3: 'Closed for the season', 6: "It isn't up there now" }]],
    ],
    note: ["Bring water, a warm layer and a headlamp. There's no cell coverage past the lodge.", { 3: "Bring water and a warm layer. Leave the headlamp in your pack unless you're indoors.", 5: "Tomás had the hut lamp on. We think that's how it found the hut." }],
    cap: ['Park map. Paper copies are free at both entrance stations.', {
      3: 'Park map. The hatched area is a seasonal closure.',
      4: "Park map, reprinted Sept. 16. The straight line isn't a trail and you shouldn't walk it.",
      5: "It didn't go around the lake. The marks go in on the north shore and come out on the south.",
      6: 'The line keeps going off the bottom of the map. So did it.',
    }],
  },
  echo: {
    h2: ['How the echo works', { 3: 'No shouting at Echo Point', 4: 'Echo Point is closed', 5: 'Nobody is shouting up there', 6: "It's using your voice now" }],
    intro: ["Shout from the rail at Echo Point and you'll hear it four more times. Four cliffs on the slope below Halloran Meadows face the point, the nearest about 600 feet off and the farthest more than half a mile, and sound only travels about 1,100 feet a second. The last echo takes five and a half seconds to get back. June does a short echo talk up there at 10 and 2, and she brings a stopwatch.", {
      1: "Call from the rail at Echo Point and you'll hear it four more times. Four cliffs on the slope below Halloran Meadows face the point, the nearest about 600 feet off and the farthest more than half a mile, and sound only travels about 1,100 feet a second. The last answer takes five and a half seconds to get back. June does a short echo talk up there at 10 and 2, and she brings a stopwatch.",
      2: "Shout from the rail at Echo Point and you'll hear it four more times, once for each cliff on the chart. A few visitors this month have timed a fifth, about seven seconds after the shout. That would take a cliff 3,800 feet out, and there isn't one. We walked up and looked, and it's all trees. If you hear a fifth, tell a ranger what time it was.",
      3: "Echo Point is closed to shouting until further notice, so please don't test this. We've left the chart up so you know what the four real echoes sound like. If you hear a fifth, don't answer it. Walk back down to the lodge and tell the front desk.",
      4: "Echo Point is closed. On the 14th the fifth one came back 1.3 seconds before June's tour group had shouted anything. Going by the chart, that puts it behind the point on the lodge side, about 700 feet back in the trees.",
      5: "Nobody has shouted from Echo Point since the 14th, so the cliffs have nothing to send back. What people hear from up there now starts by itself. On the morning of the 15th it sounded like Tomás. By that night it sounded like June.",
      6: "You've been reading these pages in your own voice. It's been listening since the first one. The red mark on the chart isn't you.",
    }],
    cap: ['Echo Point and the four cliffs, looking northwest. The lodge is half a mile downhill to the left, and Halloran Meadows is up the slope to the right.', {
      2: 'Echo Point and the four cliffs. The red mark is where a fifth cliff would have to be.',
      3: 'Echo Point is closed to shouting. The outlines show a normal shout and its four echoes.',
      4: 'The fifth one on the 14th, 1.3 seconds before the shout. That puts it behind the point, on the way down to the lodge.',
      5: 'What was heard from Echo Point on the 15th. Nobody was up there.',
      6: 'The yellow one is you. The red one started a tenth of a second later.',
    }],
    label: 'Diagram: a side view of Echo Point and the slope below Halloran Meadows. A shout from Echo Point comes back from four cliff faces 600, 1,300, 2,100 and 3,000 feet away, after 1.1, 2.4, 3.8 and 5.5 seconds.',
  },
  rangers: {
    h2: ['Meet the rangers', { 4: 'Meet the ranger', 5: 'Staff', 6: 'Ines can see it from where she is' }],
    intro: ["We have 31 rangers in summer and about a dozen through the winter. These four run most of the public programs, so chances are you'll meet at least one of them.", {
      2: "We have 31 rangers in summer and about a dozen through the winter. These four have been here the longest. If something seems off during your visit, they're the ones to tell.",
      4: "We had 31 rangers this summer. As of September 16 we're down to one who answers the radio.",
      5: "One ranger. Please don't ask her about the others.",
    }],
    people: [
      { name: 'Ines Okafor', role: 'Chief Ranger', bio: ['Nineteen seasons at Echo Basin. Runs the 7 am canoe tour on Saturdays and will absolutely race you back to the dock.', {
        2: "Nineteen seasons at Echo Basin. She hasn't taken a day off since the 12th and has started sleeping at the station.",
        3: "Ask Ines why the staff are all facing away from the trees in this photo and she'll say the light was better. Ask again and she'll change the subject.",
        4: "Ines wrote the dusk rule on the back of a trail map at 3 am on the 13th. Nobody's revised it because so far she hasn't been wrong.",
        5: "Ines is still at the station. She's stopped answering the radio in case it isn't us.",
        6: "Ines says to tell you she's sorry. She says please don't turn around.",
      }] },
      { name: 'Tomás Reyes', role: ['Backcountry Ranger', { 5: 'Not on current staff list' }], bio: ['Patrols Echo Pass on skis from November to May and keeps the Pass Hut stocked. Makes the best camp coffee in the park, according to him.', {
        2: "Has been sleeping at the Pass Hut with the shutters latched. Says the wind up there has started to sound like people he knows.",
        3: "Tomás asks that nobody knock at the hut after dark. He won't open the door. That goes for staff, and for anybody who sounds like staff.",
        4: 'Tomás last radioed in at 5:30 am on the 15th. He said his sister was outside the hut asking to be let in. His sister lives in Tucson.',
        5: 'No longer listed.',
      }] },
      { name: 'June Halvorsen', role: ['Interpretive Ranger', { 5: 'Not on current staff list' }], bio: ['Gives the Echo Point talk at 10 and 2. Can name every bird in the basin by ear and will quiz you on them.', {
        2: "Can name every bird in the basin by ear. This month she's written down eleven calls she can't name.",
        3: "June has stopped giving the Echo Point talk. Please don't ask her to demonstrate the echo.",
        4: 'June answered it on the 14th, at 1:55 in the afternoon, in front of a tour group. We found her hat at the trailhead.',
        5: 'No longer listed.',
      }] },
      { name: 'Sam Whitlow', role: ['Trail Crew Lead', { 5: 'Not on current staff list' }], bio: ['Rebuilt the Cathedral Stand boardwalk over three summers. Ask him about cedar if you have an hour to kill.', {
        2: 'Rebuilt the Cathedral Stand boardwalk over three summers. Sam was the first to notice the bark damage and has been measuring it ever since.',
        3: "Sam measures the marks every Monday. Forty feet, give or take an inch, on 212 trees so far. He's quit guessing what's doing it.",
        4: "Sam went up to measure on Monday the 16th and hasn't signed out.",
        5: 'No longer listed.',
      }] },
    ],
    cap: ['Summer staff at the Cathedral Stand trailhead. Left to right: Ines, Tomás, June, Sam.', {
      2: "Summer staff at the trailhead. Nobody would stand facing the trees, so this is the only angle we've got.",
      4: 'Staff photo, retaken Sept. 16. The hats were found at the trailhead.',
    }],
  },
  wildlife: {
    h2: ['Wildlife', { 2: 'Wildlife, for now', 4: 'Wildlife: fall count', 5: 'What lives here now' }],
    intro: ["More than 200 species live in the park. Please give all of them room: 25 yards for elk and deer, 100 yards for bears. If an animal changes what it's doing because of you, you're too close.", {
      3: "Give all wildlife room. One more thing. If every animal you can see is facing the same direction, don't turn to look. Walk back the way you came.",
      4: 'The spring survey counted 214 species. The survey on September 14 counted eleven, and nine of those were birds flying over.',
    }],
    items: [
      ['Roosevelt elk', ['A herd of about sixty grazes Halloran Meadows at dawn and dusk. The bulls bugle through September and you can hear it from the lodge.', {
        2: "About sixty in Halloran Meadows. The bulls haven't bugled at all this year, which has never happened before.",
        3: "The herd spends hours standing still, all facing the east treeline. There's nothing there that we can find.",
        4: 'Not seen since September 14.',
      }]],
      ['Common loon', ['Two pairs nest on Echo Lake. Listen for them around dusk.', {
        2: 'Two pairs nest on Echo Lake. Guests keep reporting a third call from the wrong side of the lake.',
        3: "If you hear a loon call coming from the forest, it isn't a loon. Loons don't go in the forest.",
        4: 'Not seen, but still heard most nights from the trees.',
      }]],
      ['Great horned owl', ['Lives in Cathedral Stand year round. You can often hear one from the lodge porch after dark.', {
        2: 'Lives in Cathedral Stand year round. If you want to listen for one, the lounge windows work about as well as the porch.',
        3: 'Every owl we know about has moved to the lodge roof. They sit facing the stand.',
        4: 'Still here. Five on the lodge roof as of the 16th, all facing north.',
      }]],
      ['Black bear', ['Around forty in the park. Every campsite has a bear locker. Please use it, and yes, that includes toothpaste.', {
        3: "The bears left in the last week of August. Several were seen walking out along the highway, which isn't something bears normally do.",
        4: 'None.',
      }]],
      [['Seen something we missed?', { 3: 'Not listed', 6: 'You know what it is' }], ['Tell us at any ranger station. Good sightings go in the park log with your name on them.', {
        3: "There's one animal we haven't put on this page. We don't have a name for it or a photo. Please don't try to get us one.",
        4: "What we know so far: it's very tall, it copies voices, and it comes toward people who look at it.",
        5: "You've been looking for it in every picture.",
        6: 'It noticed.',
      }]],
    ],
    cap: ['Elk in Halloran Meadows, around 7 pm.', { 3: 'Halloran Meadows, Sept. 13. They stood like this for two hours.', 4: "Halloran Meadows, Sept. 15. The track through the flowers wasn't there the day before." }],
  },
  field: {
    h2: ['Today in the park', { 3: 'Check these before you go outside', 4: 'Tonight in the park', 5: 'Nobody is posting these', 6: 'Where you are right now' }],
    intro: ["The pass usually runs about 20 degrees colder than the lake, so check both temperatures before you pick a trail, and check sunset before you pick a long one. Tracks are easiest to find first thing in the morning, in the mud along the Lakeshore Loop.", {
      2: "The pass usually runs about 20 degrees colder than the lake, so check both temperatures before you pick a trail. The Lakeshore Rd gate locks at dusk now, so check sunset too. We've added a line at the bottom of the track card for one we can't identify yet. If you've seen it, tell a ranger where.",
      3: "Check all three before you leave the building. If you come across the track on the bottom line of the card, turn around and walk back the way you came. If conditions are within half a mile, don't go out at all. Be inside by 7:42.",
      4: "The track card is down to one track. The last report had conditions less than half a mile from the lodge. Each dot on the daylight chart is somebody who signed the trail register and hasn't signed out.",
      5: "Nobody is updating these. The pass stopped reporting on the 15th and the front desk stopped on the 16th. The track on the card is the only one anybody is still finding.",
      6: "These updated when you got here. The track is 38 feet behind yours. Conditions are where you are.",
    }],
    note: ['Updated every morning by 6 at the lodge front desk and both entrance stations.', { 3: 'Updated every hour during daylight at the lodge front desk.', 4: 'Last updated Sept. 16 at the lodge front desk.', 5: 'No longer updated.', 6: 'Updated just now.' }],
    labels: {
      tracks: 'Track identification card: black bear, Roosevelt elk, black-tailed deer and snowshoe hare, each with its print size and stride.',
      conditions: 'Current conditions: wind, temperature at Basin Lodge and Echo Pass, and fire danger.',
      daylight: 'Daylight chart for May to October, with today marked: sunrise 6:58 am, sunset 7:42 pm.',
    },
  },
  safety: {
    h2: ['Know before you go', { 3: 'Know before you go out', 4: 'Read this before dark', 5: 'You were told', 6: 'You read all of it' }],
    rules: [
      [['Carry water', { 3: 'Keep your light off outside', 4: 'No lights outside' }], ['A liter for every two hours of hiking, more in July. Lake and stream water has to be filtered.', {
        3: 'Headlamps and lanterns show where you are. After dusk, follow the reflective trail markers and save the light for indoors.',
        4: 'The hut had a lamp in the window on the 15th.',
      }]],
      [['Stay on the trail', { 4: 'Stay off the straight line' }], ['Shortcuts kill meadow plants that take twenty years to grow back. Also, we find lost people a lot faster when they stayed on a trail.', {
        3: "This matters more than it used to. It doesn't follow the trails, so if you're on one you're less likely to be in its way.",
        4: "It walks straight. It went through the lake instead of around it. If your route crosses the line on the new map, cross fast and don't stop on it.",
      }]],
      [['Lock up your food', { 3: "If you hear your name, don't answer", 4: 'It knows more voices now', 5: 'You answered' }], ["Use the bear locker at your site. Coolers and tents don't count.", {
        3: "That goes for the woods, the water, and right outside your tent. Staff don't know your name, and whoever you came with is already next to you. Check by touching them, not by calling out.",
        4: "It'll sound like whoever you came with. Later it'll sound like you. A guest in Cabin 3 heard her husband call her from the lake while he was asleep next to her.",
        5: 'Maybe not out loud. Reading it in your head seems to count.',
      }]],
      [['Make noise on blind corners', { 3: 'Keep quiet on the trail', 4: "Don't look above the treeline" }], ['Bears would rather hear you coming. Talk, clap, sing badly.', {
        3: 'The old advice was for bears. The bears are gone, and sound carries a long way here.',
        4: "If you already looked, don't look again. Keep the same pace and keep your eyes down. It comes toward people who look at it.",
      }]],
      [['Check conditions', { 3: 'Ask where conditions are', 4: 'Conditions advisory tonight' }], ['Weather at the pass can turn in an hour. Call the ranger line or stop at a station before you head up.', {
        2: 'Weather at the pass can turn in an hour. Call the ranger line before you head up, and ask where conditions were last reported while you have them on the phone.',
        3: "The ranger line will give you a direction and a distance. If it's under half a mile, stay inside and close the curtains.",
        4: 'Stay indoors. Close the curtains on the lake side. Staff doing rounds will knock at normal door height and say your room number.',
        5: "If the knock comes from higher than the door, it isn't staff. Don't go to the window to check.",
      }]],
      [['Sign the trail register', { 4: 'Sign out', 6: "You're in the register" }], ["Sign in at the trailhead and sign out when you're back. If you don't sign out, we come looking.", {
        3: "Use your own handwriting. If your name is already on today's page and you didn't write it, don't go in. Tell staff.",
        4: "Seven people signed in last week. Five of them haven't signed out.",
        6: 'Last line.',
      }]],
    ],
  },
  memo: {
    head: ['ECHO BASIN PARK AUTHORITY. Internal, do not post.', { 6: "You weren't supposed to see this one." }],
    meta: ['To: all district staff', 'From: I. Okafor', 'Date: Sept. 13', 'Re: dusk procedure (replaces yesterday’s)'],
    lines: [
      ['Everybody indoors by dusk. That includes search teams. I know.'],
      ['No names on the radio, post numbers only. ', [4, "It's picked up eleven names so far and it uses them."]],
      ['When you talk to visitors or pose for photos, keep your back to the trees. ', [4, 'It comes closer when somebody is looking at it.']],
      ['Log the bark and crown damage as wind. Log the height as ', [5, "forty feet. It's taller than that. Sam thinks it crouches to get under the canopy."]],
      ['If a visitor reports a fifth echo, get them inside and ', [4, "don't tell them the fifth one was their own voice."]],
      ["Knock at door height and say the room number. Guests have been told anything else isn't us."],
    ],
    hand: "Ines, it was at the lodge last night. Every window on the lake side at the same time, looking in from above. It doesn't need the door. I'm going up to measure anyway. S.",
    stamp: ['FILED', { 4: 'REVISED', 5: 'VOID' }],
  },
  reg: {
    head: ['Trail register, Basin Lodge trailhead', { 5: 'Trail register, last page' }],
    rows: [
      ['Sep 12', 'R. Castellanos', 'Lakeshore', '08:10', '10:35'],
      ['Sep 13', 'D. Kessler +1', 'Cathedral Stand', '09:40', '11:15'],
      ['Sep 14', 'M. Arroyo', 'Cathedral Stand', '06:20', '—'],
      ['Sep 14', 'J. Halvorsen (staff)', 'Echo Point', '13:55', '—'],
      ['Sep 15', 'T. Reyes (staff)', 'Echo Pass', '05:30', '—'],
      ['Sep 15', 'D. Kessler', 'Lakeshore', '19:50', '—'],
      ['Sep 16', 'S. Whitlow (staff)', 'Cathedral Stand', '07:00', '—'],
    ],
    you: ['(not signed)', { 6: 'you' }],
    youTrail: 'this page',
  },
  stay: {
    h2: ['Lodging and camping', { 3: 'Lodging and camping: new rules', 4: 'Lodging', 5: 'It knows which cabin', 6: "It was never after the cabin" }],
    intro: ['Basin Lodge has 24 rooms and six cabins on the water. Cedar Flats has 80 campsites back in the trees. Summer weekends sell out by March, so book early or come midweek.', {
      2: 'Basin Lodge has 24 rooms and six cabins on the water. Cedar Flats has 80 campsites back in the trees. Starting this month, quiet hours begin at dusk instead of 10 pm. Thanks for understanding.',
      3: 'All guests need to be inside by dusk. Please close the curtains on the lake side of your room and keep them closed until morning, even if somebody asks you to open them.',
      4: "Basin Lodge has 24 rooms and 23 of them are empty. We're keeping one light on in the lobby. Cedar Flats is closed, and the tents are still there.",
      5: 'We turned the lodge lights off because it came to the windows. All of the upstairs ones, at the same time.',
    }],
    opts: [
      ['Lodge room', 'from $189/night', ['Includes breakfast and an hour of canoe rental. Half the rooms face the lake, so ask for one of those.', { 3: 'Lake-view rooms now come with blackout curtains. Please use them.', 4: 'Staff will knock at door height and say your room number.', 5: 'If something knocks on the wall above the door, stay still and stay quiet.' }]],
      ['Lakeside cabin', 'from $240/night', ['Sleeps four. Wood stove, kitchenette, and about twenty steps to the dock.', { 3: "Sleeps four. Count heads before you lock up, and count by touch if it's dark.", 4: "Cabin 3 is out of service. Something leaned on it and the door frame isn't square anymore." }]],
      ['Cedar Flats campsite', '$28/night', ['Fire ring, picnic table, bear locker, and a water tap every few sites. Quiet hours are 10 pm to 6 am.', { 2: 'Fire ring, picnic table, bear locker, and a water tap every few sites. Quiet hours now start at dusk.', 3: "If somebody outside your tent says your name, don't unzip it and don't answer. Wait for daylight.", 4: "Closed. If you left gear behind, we can't get it for you right now." }]],
      ['Backcountry permit', '$12 per group', ['Required for overnight trips above Halloran Meadows. Pick it up in person at the ranger station.', { 3: 'Not issued after 12 noon.', 4: 'Not being issued.' }]],
    ],
    cap: ['Basin Lodge from the lake, a little after sunset.', { 3: 'Basin Lodge at dusk. Lake-side curtains closed, please.', 4: 'Basin Lodge, Sept. 16. One light on in the lobby.', 5: 'Basin Lodge. We locked that door when we left.' }],
  },
  night: {
    h2: ['Dark sky programs', { 4: 'Dark sky programs (cancelled)', 5: 'What happened to the Pass Hut', 6: 'It leaned down to look in' }],
    body: ["The nearest town is sixty miles away, so the sky here gets properly dark. On a clear night at the pass you can see the Milky Way without even trying. Rangers set up telescopes outside the Pass Hut on Friday and Saturday nights from June through September. It's free and you don't need to book.", {
      3: "Telescopes are still out on Fridays and Saturdays. They're pointed at the sky. Please don't swing them down toward the ridge or the treeline, not even as a joke.",
      4: "On Friday the snow came off the east side of the hut roof all at once, with the group standing outside. There wasn't any wind. The two visitors who walked round to look didn't come back down with everybody else.",
      5: "By Sunday that side of the roof was pushed in and the chimney was lying in the snow. The walls are fine. Whatever did it was standing over the hut, and it put its weight down from above.",
    }],
    facts: [
      ['Star talks: Fri and Sat, 9 pm, outside Pass Hut', { 4: 'Star talks: cancelled until further notice' }],
      ['Dress warm and bring a red flashlight', { 3: 'Dress warm. No lights of any color.', 5: 'It saw the flashlights' }],
      ['Moonrise tonight: 9:14 pm', { 5: 'It stood up at 9:14 pm' }],
    ],
    cap: ['Looking north from the Pass Hut, about 10 pm.', { 4: 'Friday night. The snow is off one side of the roof and not the other.', 5: "Same view on Sunday. The door was already open. It didn't use it." }],
  },
  voice: {
    quote: ["We booked two nights for our anniversary and ended up staying six. I slept better than I have in years. Ask for Cabin 3 if you can get it.", {
      2: "We booked two nights and ended up staying six. It's so quiet at night. Even the frogs quit around ten, like somebody told them to.",
      3: "The second night somebody called my name from down by the water. It was Mark's voice. Mark was asleep right next to me.",
      4: 'I know the sign said not to, but I looked. It was standing in the lake up to about its knees. The guy at the dock had told us the lake is 260 feet deep there.',
      5: "It was looking at our cabin, and then it was looking at me. I think it had been waiting the whole time for one of us to look.",
      6: "It isn't looking at me anymore. I can see it from the dock. It's right behind you.",
    }],
    who: ['Dana K., stayed in Cabin 3 last September', { 4: 'Dana K., Cabin 3, checked in Sept. 11', 5: 'Dana K., Cabin 3, not checked out' }],
  },
  plan: {
    h2: ['Plan your visit', { 5: 'Your visit', 6: "You're already here" }],
    body: ['Passes are $30 per vehicle and good for seven days. Buy one at either entrance station, or online before you come. The road to the lodge is plowed all winter.', {
      5: "There's nobody at the entrance stations. The gate has been open since the 15th, and we didn't open it.",
      6: "Everybody on the dock can see it. That's why none of them are looking at you.",
    }],
    typed: "You've been on this site for {m}. We should have taken it down days ago, and we're sorry. It left the park last night. Please don't turn around.",
    cta: 'Plan your visit',
    cap: ['The lodge dock at night.', { 5: 'The lodge dock, Sept. 16. The six people still at the lodge. Nobody asked them to come out.', 6: 'The lodge dock, right now.' }],
  },
  foot: {
    by: ['Echo Basin National Park is managed by the Echo Basin Park Authority.', { 5: 'This page is no longer being updated.' }],
    visit: [['Hours and seasons', { 3: 'Daylight hours' }], 'Fees and passes', 'Accessibility', ['Lost and found', { 4: 'Lost', 5: 'Found' }]],
    contact: [
      ['Ranger line, 6 am to 8 pm: 555-0142', { 3: 'Ranger line, daylight only: 555-0142', 4: "Please don't call the ranger line after dark. Something has been answering it.", 6: "If your phone rings in the next minute, that isn't us." }],
      ['Lodge front desk: 555-0169', { 4: 'Lodge front desk: no answer', 5: 'Lodge front desk: something picks up' }],
    ],
  },
};
