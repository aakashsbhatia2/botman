import { google } from "googleapis";
import { config } from "../config.js";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export function createCalendar() {
  const auth = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
  );
  auth.setCredentials({ refresh_token: config.googleRefreshToken });

  const calendar = google.calendar({ version: "v3", auth });

  return {
    async createEvent({ title, start, end, description, attendees = [] }) {
      const endTime =
        end ?? new Date(new Date(start).getTime() + DEFAULT_DURATION_MS).toISOString();

      const res = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        requestBody: {
          summary: title,
          description,
          start: { dateTime: start, timeZone: config.timezone },
          end: { dateTime: endTime, timeZone: config.timezone },
          attendees: attendees.map((email) => ({ email })),
        },
      });

      const event = res.data;
      return {
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        link: event.htmlLink,
      };
    },
  };
}
