// Map windows for the trail pages. Each is a piece of the park map cut out and enlarged, with that page's trail drawn
// heavier and carrying its number: the same sheet, drawn by the same code (sheetWindow in scene-map.mjs), so at every
// stage it shows exactly what the map shows on that ground, the closures, crosses, plotted line and changed names
// included, entering and leaving the window where they would on the full map.
//
// Each frame holds its whole trail with room around it and both of its ends named. The three on the route up from
// the lodge overlap. Each box is the ground inside the neatline, in sheet units (60 to the mile); the picture is 640
// wide and as tall as its box makes it.
import { sheetWindow } from './scene-map.mjs';

// Lakeshore Loop: the lodge, the north shore west of it and the bench above, with the lake below. From stage 5 the
// plotted line comes through the lodge and out across the water. A wide strip, because the names that bound it are
// wide: Echo Point's (with its stage 3 words) to the east, Halloran Cr. just above, Cedar Flats just below. Holding
// Cedar Flats as well would make the loop a quarter smaller, so the strip stops short of the far shore.
export const mapLakeshore = () => sheetWindow({ trail: 1, box: [540, 242, 755, 347] });
// Cathedral Stand: the loop through the stand, down to its parking on Lakeshore Rd, with the shore below. Off the
// line, so the plotted path never crosses it; the closure reaches it at stage 4.
export const mapCathedral = () => sheetWindow({ trail: 2, box: [361, 260, 511, 356] });
// Echo Point: the lodge up to the rail, with the switchbacks of trail 4 going on above, and room at the top for the
// head of the stage 4 line, which stops just above the point.
export const mapEchoPoint = () => sheetWindow({ trail: 3, box: [600, 212, 731, 292] });
// Halloran Meadows: Echo Point up the switchbacks to the meadows.
export const mapHalloran = () => sheetWindow({ trail: 4, box: [648, 170, 778, 260] });
// Echo Pass: the meadows, the hut and the pass, between Corrie Peak and Mt. Tolliver.
export const mapEchoPass = () => sheetWindow({ trail: 5, box: [680, 48, 905, 222] });
