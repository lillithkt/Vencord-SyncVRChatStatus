/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RendererSettings } from "@main/settings";
import { IpcMainInvokeEvent } from "electron";
import { Secret, TOTP } from "otpauth";
import { AuthenticationApi, Configuration, UsersApi } from "vrchat";

let authApi: AuthenticationApi | null = null;
let usersApi: UsersApi | null = null;
let userId: string | null = null;

export async function logIn() {
    if (authApi || usersApi || userId) return;
    const settings = RendererSettings.store.plugins?.SyncVRChatStatus;
    const username = settings?.username;
    const password = settings?.password;
    const totpKey = settings?.totpKey;
    if (!username || !password || !totpKey) {
        console.error("Missing settings");
        return;
    }

    const config = new Configuration({
        basePath: "https://api.vrchat.cloud/api/1",
        username,
        password,
        baseOptions: {
            headers: {
                "User-Agent": `Vencord/${VERSION}`
            }
        }
    });


    authApi = new AuthenticationApi(config);
    await authApi.getCurrentUser();
    await authApi.verify2FA({
        code: new TOTP({
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: Secret.fromBase32(totpKey)
        }).generate()
    });

    try {
        const user = await authApi.getCurrentUser();
        userId = user.data.id;
    } catch (e) {
        console.error(e);
        authApi = null;
        usersApi = null;
        userId = null;
        throw e;
    }
    usersApi = new UsersApi(config);
}

export async function getStatus(): Promise<string | undefined> {
    if (!authApi) return undefined;
    const user = await authApi.getCurrentUser();
    return user.data.statusDescription;
}

export async function setStatus(_: IpcMainInvokeEvent, status: string | undefined) {
    if (!usersApi || !userId) return;
    await usersApi.updateUser(userId, {
        statusDescription: status
    });
}
