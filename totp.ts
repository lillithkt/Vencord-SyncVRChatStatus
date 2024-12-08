/* eslint-disable simple-header/header */
/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * Original source: https://github.com/turistu/totp-in-javascript/blob/main/totp.js
 * Author: turistu
 */


export default async function totp(key, secs = 30, digits = 6) {
    return hotp(unbase32(key), pack64bu(Date.now() / 1000 / secs), digits);
}
async function hotp(key, counter, digits) {
    let y = crypto.subtle;
    if (!y) throw Error('no crypto.subtle object available');
    let k = await y.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    return hotp_truncate(await y.sign('HMAC', k, counter), digits);
}
function hotp_truncate(buf, digits) {
    let a = new Uint8Array(buf), i = a[19] & 0xf;
    return fmt(10, digits, ((a[i] & 0x7f) << 24 | a[i + 1] << 16 | a[i + 2] << 8 | a[i + 3]) % 10 ** digits);
}

function fmt(base, width, num) {
    return num.toString(base).padStart(width, '0');
}
function unbase32(s) {
    let t = (s.toLowerCase().match(/\S/g) || []).map(c => {
        let i = 'abcdefghijklmnopqrstuvwxyz234567'.indexOf(c);
        if (i < 0) throw Error(`bad char '${c}' in key`);
        return fmt(2, 5, i);
    }).join('');
    if (t.length < 8) throw Error('key too short');
    return new Uint8Array(t.match(/.{8}/g).map(d => parseInt(d, 2)));
}
function pack64bu(v) {
    let b = new ArrayBuffer(8), d = new DataView(b);
    d.setUint32(0, v / 2 ** 32);
    d.setUint32(4, v);
    return b;
}