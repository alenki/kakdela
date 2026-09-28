import { afterEach, describe, expect, it, vi } from "vitest";
import { sendNote } from "./actions";
import { IDLE } from "@/lib/feedback";

const note = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("the note's action", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses a note without the guest's consent, whatever the page did", async () => {
    const res = await sendNote(IDLE, note({ text: "Всё шик" }));
    expect(res).toMatchObject({ status: "invalid", errors: { consent: "missing" } });
  });

  it("collects nothing in production while the consent has blanks, even with the mail set up", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FEEDBACK_SMTP_URL", "smtp://127.0.0.1:1");
    vi.stubEnv("FEEDBACK_MAIL_TO", "notes@example.ru");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await sendNote(IDLE, note({ text: "Всё шик", consent: "yes", contact: "anna@mail.ru" }));
    expect(res.status).toBe("failed");
    // The operator learns why; the guest's words never reach the log.
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0][0])).toMatch(/consent names no/);
    expect(String(log.mock.calls[0][0])).not.toMatch(/Всё шик|anna@mail\.ru/);
  });

  it("sends in development without settings, printing the letter with the consent's edition", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FEEDBACK_SMTP_URL", "");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await sendNote(IDLE, note({ text: "Всё шик", consent: "yes", tone: "shik" }));
    expect(res).toMatchObject({ status: "sent", channel: null });
    expect(String(log.mock.calls[0][0])).toMatch(/Согласие на обработку персональных данных: дано, редакция от \d+ \S+ \d{4} года/);
  });
});
