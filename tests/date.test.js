import {
  getEventsToDisplay,
  getNextEventsToDisplay,
  eventStatusToIndicatorText,
} from "../src/date.js";

function check(condition, message) {
  if (!condition)
    throw new Error(message);
}

function makeEvent(startOffsetMin, endOffsetMin, summary = "Event") {
  const now = Date.now();
  return {
    summary,
    date: new Date(now + startOffsetMin * 60000),
    end: new Date(now + endOffsetMin * 60000),
  };
}

// No events -> nothing to show
let status = getNextEventsToDisplay([], 0);
check(
  status.currentEvent === null && status.nextEvent === null,
  "empty list should yield no event"
);

// Event starting in 3 hours is outside a 2 hour window
status = getNextEventsToDisplay([makeEvent(180, 240)], 120);
check(
  status.currentEvent === null && status.nextEvent === null,
  "event outside the look-ahead window should be ignored"
);

// ...but inside a 4 hour window
status = getNextEventsToDisplay([makeEvent(180, 240)], 240);
check(
  status.currentEvent === null && status.nextEvent !== null,
  "event inside the look-ahead window should be shown"
);

// 0 means no limit
status = getNextEventsToDisplay([makeEvent(600, 660)], 0);
check(status.nextEvent !== null, "0 should not limit the look-ahead");

// Ongoing event is kept; a far away next event is dropped
status = getNextEventsToDisplay([makeEvent(-30, 30), makeEvent(180, 240)], 60);
check(status.currentEvent !== null, "ongoing event should be shown");
check(
  status.nextEvent === null,
  "next event outside the window should be dropped"
);

// Default range ends at tomorrow midnight
let rangeStart;
let rangeEnd;
const source = {
  _loadEvents() {},
  getEvents(start, end) {
    rangeStart = start;
    rangeEnd = end;
    return [];
  },
};

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

getEventsToDisplay(source, 0);
check(
  rangeStart.getTime() === today.getTime(),
  "range should start at today midnight"
);
check(
  rangeEnd.getTime() === tomorrow.getTime(),
  "without a window the range should end at tomorrow midnight"
);

// A look-ahead window extends the queried range
const before = Date.now();
getEventsToDisplay(source, 120);
check(
  rangeEnd.getTime() >= before + 120 * 60000,
  "range should extend to cover the look-ahead window"
);

// Single-digit minutes are zero-padded
const fivePastEleven = new Date();
fivePastEleven.setHours(11, 5, 0, 0);
const text = eventStatusToIndicatorText({
  currentEvent: null,
  nextEvent: { summary: "Test", date: fivePastEleven },
});
check(text.endsWith("at 11:05"), `expected 11:05 in "${text}"`);
