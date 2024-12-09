// thank you nuckyz

import { getUserSettingLazy } from "@api/UserSettings";

const CustomStatus = getUserSettingLazy("status", "customStatus")!;

function getExpirationMs(expiration: "TODAY" | number) {
    if (expiration !== "TODAY") return Date.now() + expiration;

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

interface Emoji {
    id: string | null;
    name: string;
}

export default function setStatus(text: string | undefined, emoji?: Emoji, expiration?: "TODAY" | number | null) {
    const trimmedText = text?.trim();

    if ((trimmedText?.length || 0) > 0 || emoji != null) {
        CustomStatus.updateSetting({
            text: trimmedText!.length > 0 ? trimmedText : "",
            expiresAtMs: expiration != null ? String(getExpirationMs(expiration)) : "0",
            emojiId: emoji?.id ?? "0",
            emojiName: emoji?.name ?? "",
            createdAtMs: String(Date.now())
        });
    } else {
        CustomStatus.updateSetting(undefined);
    }
}