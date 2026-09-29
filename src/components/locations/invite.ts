import { routes, SITE_URL } from "@/content/routes";
import { EN } from "@/i18n/locale";
import { t } from "@/i18n";
import { shortAddress } from "./address";

/** The share link's mark: an invitation, not just a link to a café (the row then says «вас позвали сюда»). */
export const INVITE_PARAM = "vstrecha";

/** The link a friend gets: /locations opened on this café, marked as an invitation. */
export const inviteUrl = (id: string) => `${SITE_URL}${EN ? "/en" : ""}${routes.locations.href}?${INVITE_PARAM}#${id}`;

/** «Встретимся в «Как дела?» на Лермонтова, 4?»: the guest's own message, the address as friends say it. */
export const inviteText = (address: string) => t.locationsPage.invite.text(shortAddress(address));
