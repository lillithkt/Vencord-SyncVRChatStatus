/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// thank you nuckyz

import { getUserSettingLazy } from "@api/UserSettings";

const CustomStatus = getUserSettingLazy("status", "customStatus")!;

function getExpirationMs(expiration: "TODAY" | number) {
    if (expiration !== "TODAY") return Date.now() + expiration;

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

export default function setStatus(text: string | undefined, expiration?: "TODAY" | number | null) {
    const trimmedText = text?.trim();

    const old = CustomStatus.getSetting();

    if ((trimmedText?.length || 0) > 0 || old.emojiId != null) {
        CustomStatus.updateSetting({
            text: trimmedText!.length > 0 ? trimmedText : "",
            expiresAtMs: expiration != null ? String(getExpirationMs(expiration)) : "0",
            emojiId: old?.emojiId ?? "0",
            emojiName: old?.emojiName ?? "",
            createdAtMs: String(Date.now())
        });
    } else {
        CustomStatus.updateSetting(undefined);
    }
}
