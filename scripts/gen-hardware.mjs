#!/usr/bin/env node
// Writes content/docs/data-sources/supported-hardware.mdx from the profile files of an Epilykos
// checkout. Run it again whenever profiles change: npm run gen:hardware -- /path/to/Epilykos
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const repo = resolve(process.argv[2] ?? "../Epilykos");
const commit = execFileSync("git", ["-C", repo, "rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();

// Protocol ids as written in the profile files, in the words the app's UI uses.
const protocolNames = {
  "solarman-v5": "Solarman V5",
  "luxpower-tcp": "LuxPower",
  "felicity-tcp": "Felicity TCP/JSON",
  growatt: "Growatt",
  "ble-gatt": "Bluetooth LE",
  "modbus-rtu": "Modbus-RTU",
  "voltronic-qpigs": "Voltronic QPIGS",
  "phocos-ascii": "Phocos (ASCII)",
  "solax-aa55": "SolaX AA55 (binary)",
  "vedirect-streaming": "Victron VE.Direct",
  jbd: "JBD",
  "jk-rs485": "JK RS485",
  "pace-v25": "PACE protocol 25",
};

const cell = (value) =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("<", "&lt;")
    .replaceAll("{", "&#123;")
    .replaceAll("\n", " ")
    .trim() || "—";
const protocol = (p) => protocolNames[p.protocol ?? p.transport] ?? p.protocol ?? p.transport;
const serial = ({ defaults: d }) =>
  d ? `${d.baud} ${d.dataBits}${String(d.parity ?? "none")[0].toUpperCase()}${d.stopBits}` : "";
const note = (text) => (text ? text.split("\n")[0].replace(/^For\s+/, "") : "");

// Profiles marked placeholder are unverified skeletons the app hides from its profile lists.
const load = (dir) =>
  readdirSync(join(repo, dir))
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({
      id: basename(file, ".json"),
      ...JSON.parse(readFileSync(join(repo, dir, file), "utf8")),
    }))
    .filter((p) => p.placeholder !== true)
    .sort((a, b) => a.name.localeCompare(b.name));

// The wired BMS source lists the serial profiles whose id or name mentions BMS (public/settings.js).
const isBms = (p) => /bms/i.test(`${p.id} ${p.name}`);

// Which dongle profiles the Bluetooth connection offers, as in fillDongleProfileOptions()
// in public/settings.js.
const overBluetooth = (p) => {
  const proto = String(p.protocol ?? "").toLowerCase();
  if (proto === "ble-gatt" || p.connection === "bluetooth") return "Bluetooth only";
  if (proto === "luxpower-tcp" || p.transport === "luxpower-tcp") return "Yes, through the dongle";
  if (proto === "felicity-tcp" || String(p.transport ?? "").toLowerCase() === "growatt") return "No";
  return "Yes, Modbus over BLE";
};
const modbus = load("profiles");
const dongles = load("profiles/dongles");
const serialProfiles = load("profiles/rs232");

const sections = [
  {
    title: "Modbus register maps",
    intro:
      "These work with the **Modbus (RS485 or TCP)** source; see [Modbus](/data-sources/modbus). The Victron map is the only one " +
      "that speaks Modbus-TCP natively, but you can reach any of the RS-485 ones over the network with an RS-485 to Ethernet gateway.",
    head: ["Profile", "Native connection"],
    rows: modbus.map((p) => [p.name, p.connection === "tcp" ? "Modbus-TCP" : "RS-485 (Modbus-RTU)"]),
  },
  {
    title: "Inverter dongles",
    intro:
      "These work with the **WiFi dongle** source; see [Inverter dongles](/data-sources/inverter-dongles). The port shown is the " +
      "one the dongle normally uses, and you can change it on the source card if yours is different. The last column tells you " +
      "whether the profile is also available when the card is set to connect over Bluetooth.",
    head: ["Profile", "Protocol", "Default port", "Over Bluetooth"],
    rows: dongles.map((p) => [p.name, protocol(p), p.default_port, overBluetooth(p)]),
  },
  {
    title: "Serial inverters and charge controllers",
    intro: "These work with the **RS232 serial** source, through a USB serial adapter; see [RS232 serial](/data-sources/rs232).",
    head: ["Profile", "Protocol", "Serial settings"],
    rows: serialProfiles.filter((p) => !isBms(p)).map((p) => [p.name, protocol(p), serial(p)]),
  },
  {
    title: "Wired battery BMS",
    intro:
      "These work with **Wired BMS**, part of the **Battery management (BMS)** source; see [Battery BMS](/data-sources/bms). " +
      "Bluetooth packs are handled differently, so they're covered separately below.",
    head: ["Profile", "Protocol", "Serial settings", "Notes"],
    rows: serialProfiles
      .filter(isBms)
      .map((p) => [p.name, protocol(p), serial(p), note(p.description)]),
  },
];

const table = ({ head, rows }) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");

const body = `---
title: Supported hardware
description: Every inverter, dongle, serial protocol and wired BMS profile that comes with Epilykos.
icon: ListChecks
---

{/* Generated by scripts/gen-hardware.mjs from Epilykos ${commit}. Edit the script, not this file. */}

A profile tells Epilykos how to talk to a particular device. These are the profiles that come built
in (this list was generated from Epilykos commit \`${commit}\`). Anything you reach through
[Home Assistant](/data-sources/home-assistant), [MQTT](/data-sources/mqtt), [Tuya](/data-sources/tuya)
or a [REST API](/data-sources/rest-api) doesn't need a profile at all.

${sections.map((s) => `## ${s.title}\n\n${s.intro}\n\n${table(s)}`).join("\n\n")}

## Bluetooth BMS

Bluetooth battery packs don't need a profile. Scan for them in the **Battery management (BMS)**
source, and any pack Epilykos recognises (JK, JBD, Daly, Seplos, ANT, Renogy, EG4, PACE and many more)
is labelled with its type. See [Battery BMS](/data-sources/bms).
`;

writeFileSync("content/docs/data-sources/supported-hardware.mdx", body);
console.log(
  `Wrote supported-hardware.mdx from ${repo} @ ${commit}: ` +
    sections.map((s) => `${s.rows.length} ${s.title.toLowerCase()}`).join(", "),
);
