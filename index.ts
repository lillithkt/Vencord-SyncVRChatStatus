/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { findByCodeLazy } from "@webpack";

const Native = VencordNative.pluginHelpers.SyncVRChatStatus as PluginNative<typeof import("./native")>;

const setDiscordStatus = findByCodeLazy(".DONT_CLEAR?");

const settings = definePluginSettings({
    emojiName: {
        type: OptionType.STRING,
        default: "heartRainbot",
        description: "The emoji name to use for the Discord status.",
        restartNeeded: false,
    },
    emojiId: {
        type: OptionType.STRING,
        default: "1134797813369274420",
        description: "The emoji ID to use for the Discord status.",
        restartNeeded: false,
    },
    username: {
        type: OptionType.STRING,
        default: "",
        description: "Your VRChat username.",
        restartNeeded: true,
    },
    password: {
        type: OptionType.STRING,
        default: "",
        description: "Your VRChat password.",
        componentProps: {
            type: "password",
        },
        restartNeeded: true,
    },
    totpKey: {
        type: OptionType.STRING,
        default: "",
        description: "Your VRChat TOTP key.",
        componentProps: {
            type: "password",
        },
        restartNeeded: true,
    },
});

let lastVRChatStatus: string | undefined = undefined;
let lastDiscordStatus: string | undefined = undefined;
export default definePlugin({
    name: "SyncVRChatStatus",
    description: "Sync your VRChat status with Discord.",
    settings,
    authors: [Devs.ImLvna],
    flux: {
        USER_SETTINGS_PROTO_UPDATE: (event: any) => {
            const status: string | undefined = event.settings.proto.status?.customStatus?.text;
            if (status === lastDiscordStatus) return;
            lastDiscordStatus = status;
            if (status === lastVRChatStatus) return;
            Native.setStatus(status);
        }
    },
    interval: null as any | null,
    async start() {
        await Native.logIn();
        lastVRChatStatus = await Native.getStatus();

        this.interval = setInterval(async () => {
            lastVRChatStatus = await Native.getStatus();
            if (lastVRChatStatus === lastDiscordStatus) return;
            setDiscordStatus(lastVRChatStatus, {
                id: settings.store.emojiId,
                name: settings.store.emojiName,
            }, null);
        }, 60 * 1000) as any;
    },
    stop() {
        if (this.interval) clearInterval(this.interval);
    },
});
