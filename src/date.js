export const MAX_EVENT_SUMMARY_LENGTH = 35;

function trimLongEventName(summary, maxLength) {
  if (maxLength > 0 && summary.length > maxLength) {
    return summary.substring(0, maxLength) + "...";
  } else {
    return summary;
  }
}

function notFullDayEvent(event) {
  return !(
    event.date.getHours() === 0 &&
    event.date.getMinutes() === 0 &&
    event.end.getHours() === 0 &&
    event.end.getMinutes() === 0
  );
}

export function getEventsToDisplay(calendarSource, lookAheadMinutes = 0) {
  const src = calendarSource;
  src._loadEvents(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Get event from today at midnight

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // A look-ahead window can reach past midnight
  let rangeEnd = tomorrow;
  if (lookAheadMinutes > 0) {
    const cutoff = new Date(Date.now() + lookAheadMinutes * 60000);
    if (cutoff > rangeEnd)
      rangeEnd = cutoff;
  }

  const events = src.getEvents(today, rangeEnd).filter(notFullDayEvent);

  return events;
}

export function getNextEventsToDisplay(events, lookAheadMinutes = 0) {
  const now = new Date();

  const cutoff = lookAheadMinutes > 0
    ? now.getTime() + lookAheadMinutes * 60000
    : Infinity;

  // Ongoing events started before now, so they always pass the cutoff
  const candidates = events.filter((event) => event.date.getTime() <= cutoff);
  const N = candidates.length;

  let currentEvent = null; // The calendar event the user is currently in
  let nextEvent = null; // The next calendar event coming up
  let done = false;

  for (let i = 0; i < N; i++) {
    if (done) break;

    const event = candidates[i];
    const eventStart = event.date;
    const eventEnd = event.end;

    if (now < eventStart) {
      nextEvent = event;
      break;
    } else if (now < eventEnd) {
      currentEvent = event;

      // Check whether there's an event after this one
      if (i < N - 1) {
        let someNextEvent;

        for (let j = i + 1; j < N; j++) {
          someNextEvent = candidates[j];

          // Check whether the next event overlaps the current event
          // or whether they start at the same time

          if (!(someNextEvent.date.valueOf() === currentEvent.date.valueOf())) {
            nextEvent = someNextEvent;
            done = true;
            break;
          }
        }
      }
    }
  }

  return {
    currentEvent: currentEvent,
    nextEvent: nextEvent,
  };
}

export function eventStatusToIndicatorText(
  eventStatus,
  maxSummaryLength = MAX_EVENT_SUMMARY_LENGTH
) {
  function displayNextEvent(event) {
    const timeText = getTimeOfEventAsText(event.date);
    const diffText = getTimeToEventAsText(event.date);

    const summary = trimLongEventName(event.summary, maxSummaryLength);

    return `In ${diffText}: ${summary} at ${timeText}`;
  }

  function displayCurrentEventAndNextEvent(currentEvent, nextEvent) {
    const endsInText = getTimeToEventAsText(currentEvent.end);
    const timeText = getTimeOfEventAsText(nextEvent.date);

    const summary = trimLongEventName(nextEvent.summary, maxSummaryLength);

    return `Ends in ${endsInText}. Next: ${summary} at ${timeText}`;
  }

  function displayCurrentEvent(event) {
    const endsInText = getTimeToEventAsText(event.end);
    const summary = trimLongEventName(event.summary, maxSummaryLength);

    return `Ends in ${endsInText}: ${summary}`;
  }

  function displayNoEvents() {
    return "Done for today!";
  }

  const { currentEvent, nextEvent } = eventStatus;

  if (currentEvent != null) {
    if (nextEvent != null) {
      return displayCurrentEventAndNextEvent(currentEvent, nextEvent);
    } else {
      return displayCurrentEvent(currentEvent);
    }
  } else {
    if (nextEvent != null) {
      return displayNextEvent(nextEvent);
    } else {
      return displayNoEvents();
    }
  }
}

function getTimeOfEventAsText(eventDate) {
  const hrs = eventDate.getHours();
  let mins = eventDate.getMinutes().toString();

  mins = mins.padStart(2, "0"); // Show e.g. 11am as 11:00 instead of 11:0

  const time = `${hrs}:${mins}`;
  return time;
}

function getTimeToEventAsText(eventDate) {
  const now = new Date();
  const diff = Math.abs(eventDate - now);
  const diffInMins = Math.ceil(diff / (1000 * 60));

  const hrDiff = Math.floor(diffInMins / 60);
  const minDiff = diffInMins % 60;

  return hrDiff > 0 ? `${hrDiff} hr ${minDiff} min` : `${minDiff} min`;
}
