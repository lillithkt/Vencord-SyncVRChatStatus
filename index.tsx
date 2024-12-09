/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { Devs } from "@utils/constants";
import { ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal, openModalLazy } from "@utils/modal";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { findByCodeLazy } from "@webpack";
import { Button, useState } from "@webpack/common";

const Native = VencordNative.pluginHelpers.SyncVRChatStatus as PluginNative<typeof import("./native")>;

const setDiscordStatus = findByCodeLazy(".DONT_CLEAR?");

let loggedIn = false;

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
    }
});

let lastVRChatStatus: string | undefined = undefined;
let lastDiscordStatus: string | undefined = undefined;
const plugin = definePlugin({
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
    loginErrorModal(message: string) {
        openModal(props => {
            return <ModalRoot {...props}>
                <ModalHeader>
                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                        SyncVRChatStatus: Failed To Login
                    </Flex>
                </ModalHeader>
                <ModalContent>
                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                        {message}
                    </Flex>
                </ModalContent>
                {message !== "Invalid Credentials" && <ModalFooter>
                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                        <Button onClick={this.logIn}>Retry</Button>
                    </Flex>
                </ModalFooter>}

            </ModalRoot>;
        });
    },

    async logIn(): Promise<boolean> {
        const error = await Native.logIn();
        if (error) {
            console.error("Failed to log in:", error);
            this.loginErrorModal(error);
            return false;
        }
        return true;
    },
    async start() {
        if (!await this.logIn()) return;
        await this.syncVRCToDiscord();

        this.interval = setInterval(this.syncVRCToDiscord, 60 * 1000) as any;
    },
    async syncVRCToDiscord() {

        lastVRChatStatus = await Native.getStatus();
        if (lastVRChatStatus === lastDiscordStatus) return;
        setDiscordStatus(lastVRChatStatus, {
            id: settings.store.emojiId,
            name: settings.store.emojiName,
        }, null);
    },
    stop() {
        if (this.interval) clearInterval(this.interval);
    },
});
export default plugin;