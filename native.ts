/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RendererSettings } from "@main/settings";
import { IpcMainInvokeEvent } from "electron";
import totp from "./totp";
import { ComponentDispatch } from "@webpack/common";

let cookies: string[] = [];
let userId: string | null = null;

const userAgent = `Vencord-SyncVRChatStatus/${VERSION}`;

function parseSetCookie(cookie: string) {
    // Add everything from cookie to cookies
    cookies = cookies.concat(cookie.split(";"));
}

export async function logIn() {
    cookies = [];
    userId = null;
    const settings = RendererSettings.store.plugins?.SyncVRChatStatus;
    const username = settings?.username;
    const password = settings?.password;
    const totpKey = settings?.totpKey;
    if (!username || !password || !totpKey) {
        console.error("Missing settings");
        return;
    }


    await fetch("https://api.vrchat.cloud/api/1/auth/user", {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            "Authorization": `Basic ${btoa(`${encodeURIComponent(username)}:${encodeURIComponent(password)}`)}`
        }
    }).then(async res => {
        parseSetCookie(res.headers.get("set-cookie") || "");
    });
    await fetch("https://api.vrchat.cloud/api/1/auth/twofactorauth/totp/verify", {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            "Cookie": cookies.join(";")
        },
        method: "POST",
        body: JSON.stringify({
            code: await totp(totpKey)
        })
    }).then(async res => {
        parseSetCookie(res.headers.get("set-cookie") || "");
    });

    const user = await fetch("https://api.vrchat.cloud/api/1/auth/user", {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            "Cookie": cookies.join(";")
        }
    }).then(res => res.json());
    userId = user.id;

}

export async function getStatus(): Promise<string | undefined> {
    if (!cookies.length) return undefined;
    const user = await fetch(`https://api.vrchat.cloud/api/1/auth/user`, {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            "Cookie": cookies.join(";")
        }
    }).then(res => res.json());
    return user.statusDescription;
}

export async function setStatus(_: IpcMainInvokeEvent, status: string | undefined) {
    if (!cookies.length || !userId) return;
    await fetch(`https://api.vrchat.cloud/api/1/users/${userId}`, {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            "Cookie": cookies.join(";")
        },
        method: "PUT",
        body: JSON.stringify({
            statusDescription: status
        })
    });
}
