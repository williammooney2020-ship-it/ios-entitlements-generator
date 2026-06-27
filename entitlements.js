// iOS Entitlements Generator — browser-only, no API.
// Generates .entitlements plist based on selected iOS capabilities.

const CAPABILITIES = [
  {
    id: "push",
    label: "Push Notifications",
    icon: "🔔",
    description: "Send push notifications via APNs. Required for any remote notification.",
    requires: "Push Notifications capability in Xcode + APNs certificate or key",
    fields: [
      {
        key: "aps-environment",
        label: "Environment",
        type: "select",
        options: [
          { value: "development", label: "Development (debug builds)" },
          { value: "production", label: "Production (App Store / Ad Hoc)" },
        ],
        defaultValue: "development",
        note: "Use 'production' for App Store and Ad Hoc distribution. Development is for testing on-device via Xcode.",
      },
    ],
  },
  {
    id: "sign_in_apple",
    label: "Sign In with Apple",
    icon: "🍎",
    description: "Allow users to authenticate with their Apple ID.",
    requires: "Sign In with Apple capability enabled in App Store Connect",
    entitlement: { key: "com.apple.developer.applesignin", value: ["Default"], type: "array" },
  },
  {
    id: "icloud_kvstore",
    label: "iCloud Key-Value Storage",
    icon: "☁️",
    description: "Store small amounts of data (up to 1 MB) in iCloud, synced across user devices.",
    requires: "iCloud capability → Key-value storage checked",
    fields: [
      {
        key: "com.apple.developer.ubiquity-kvstore-identifier",
        label: "KV Store Identifier",
        type: "text",
        placeholder: "$(TeamIdentifierPrefix)$(CFBundleIdentifier)",
        defaultValue: "$(TeamIdentifierPrefix)$(CFBundleIdentifier)",
        note: "Use the default unless your apps need to share a KV store.",
      },
    ],
  },
  {
    id: "icloud_docs",
    label: "iCloud Documents (CloudKit)",
    icon: "🗄️",
    description: "Store files in iCloud Drive and sync via CloudKit containers.",
    requires: "iCloud capability → iCloud Documents and/or CloudKit checked",
    fields: [
      {
        key: "com.apple.developer.icloud-container-identifiers",
        label: "Container Identifiers (one per line)",
        type: "textarea",
        placeholder: "iCloud.$(CFBundleIdentifier)",
        defaultValue: "iCloud.$(CFBundleIdentifier)",
        note: "Each container must be registered in your developer account.",
      },
      {
        key: "com.apple.developer.icloud-services",
        label: "iCloud Services",
        type: "multicheck",
        options: [
          { value: "CloudDocuments", label: "CloudDocuments" },
          { value: "CloudKit", label: "CloudKit" },
        ],
        defaultValue: ["CloudDocuments"],
      },
    ],
  },
  {
    id: "app_groups",
    label: "App Groups",
    icon: "👥",
    description: "Share data between your main app, extensions (widgets, share extensions), and watchOS apps.",
    requires: "App Groups capability enabled in your developer account",
    fields: [
      {
        key: "com.apple.security.application-groups",
        label: "Group Identifiers (one per line)",
        type: "textarea",
        placeholder: "group.com.yourcompany.yourapp",
        defaultValue: "group.com.yourcompany.yourapp",
        note: "Must start with 'group.' — register each one in your developer account.",
      },
    ],
  },
  {
    id: "associated_domains",
    label: "Associated Domains",
    icon: "🔗",
    description: "Enable Universal Links, Handoff, shared web credentials, or Sign In with Apple.",
    requires: "Associated Domains capability + apple-app-site-association file on your server",
    fields: [
      {
        key: "com.apple.developer.associated-domains",
        label: "Domains (one per line)",
        type: "textarea",
        placeholder: "applinks:example.com\nwebcredentials:example.com",
        defaultValue: "applinks:example.com",
        note: "Prefix: applinks: (Universal Links), webcredentials: (shared creds), activitycontinuation: (Handoff).",
      },
    ],
  },
  {
    id: "healthkit",
    label: "HealthKit",
    icon: "❤️",
    description: "Read and write health and fitness data from the Health app.",
    requires: "HealthKit capability + NSHealthShareUsageDescription in Info.plist",
    fields: [
      {
        key: "com.apple.developer.healthkit",
        label: "",
        type: "bool",
        defaultValue: true,
        hidden: true,
      },
      {
        key: "com.apple.developer.healthkit.access",
        label: "Access levels",
        type: "multicheck",
        options: [
          { value: "health-records", label: "Clinical Health Records (requires additional approval)" },
        ],
        defaultValue: [],
        note: "Leave unchecked for standard health data. Clinical records require Apple approval.",
      },
    ],
  },
  {
    id: "homekit",
    label: "HomeKit",
    icon: "🏠",
    description: "Control HomeKit-compatible smart home accessories.",
    requires: "HomeKit capability in Xcode",
    entitlement: { key: "com.apple.developer.homekit", value: true, type: "bool" },
  },
  {
    id: "siri",
    label: "Siri & SiriKit",
    icon: "🎙️",
    description: "Allow Siri to interact with your app via SiriKit intents.",
    requires: "Siri capability in Xcode + NSUserActivityTypes or Intent declarations",
    entitlement: { key: "com.apple.developer.siri", value: true, type: "bool" },
  },
  {
    id: "wallet",
    label: "Wallet (PassKit)",
    icon: "💳",
    description: "Add passes (boarding passes, loyalty cards, tickets) to Apple Wallet.",
    requires: "Wallet capability — specify pass type identifiers",
    fields: [
      {
        key: "com.apple.developer.pass-type-identifiers",
        label: "Pass Type Identifiers (one per line)",
        type: "textarea",
        placeholder: "pass.com.yourcompany.yourapp",
        defaultValue: "pass.com.yourcompany.yourapp",
        note: "Register each pass type ID in your developer account under Identifiers.",
      },
    ],
  },
  {
    id: "nfc",
    label: "NFC Tag Reading",
    icon: "📡",
    description: "Read NFC tags using Core NFC.",
    requires: "NFC capability + NFCReaderUsageDescription in Info.plist",
    entitlement: { key: "com.apple.developer.nfc.readersession.formats", value: ["TAG"], type: "array" },
  },
  {
    id: "maps",
    label: "MapKit JS / Maps Private Framework",
    icon: "🗺️",
    description: "Use MapKit JS or private maps APIs.",
    requires: "Maps capability in Xcode",
    entitlement: { key: "com.apple.developer.maps", value: true, type: "bool" },
  },
  {
    id: "background_audio",
    label: "Background Audio",
    icon: "🎵",
    description: "Continue playing audio when the app moves to the background.",
    requires: "Background Modes capability + UIBackgroundModes in Info.plist",
    entitlement: {
      key: "UIBackgroundModes", value: ["audio"], type: "array",
      note: "Also add 'audio' to UIBackgroundModes in Info.plist",
    },
  },
  {
    id: "background_location",
    label: "Background Location",
    icon: "📍",
    description: "Receive location updates while your app is in the background.",
    requires: "Background Modes capability + Location usage descriptions in Info.plist",
    entitlement: { key: "UIBackgroundModes", value: ["location"], type: "array" },
  },
  {
    id: "background_fetch",
    label: "Background Fetch",
    icon: "🔄",
    description: "Periodically launch your app in the background to fetch new content.",
    requires: "Background Modes capability",
    entitlement: { key: "UIBackgroundModes", value: ["fetch"], type: "array" },
  },
  {
    id: "background_remote",
    label: "Remote Notifications (silent push)",
    icon: "🔕",
    description: "Wake your app silently in the background when a push notification arrives.",
    requires: "Background Modes + Push Notifications capabilities",
    entitlement: { key: "UIBackgroundModes", value: ["remote-notification"], type: "array" },
  },
  {
    id: "data_protection",
    label: "Data Protection",
    icon: "🔒",
    description: "Encrypt app files when the device is locked. Highly recommended for sensitive data.",
    requires: "Data Protection capability in Xcode",
    fields: [
      {
        key: "com.apple.developer.default-data-protection",
        label: "Protection Level",
        type: "select",
        options: [
          { value: "NSFileProtectionComplete", label: "Complete — inaccessible when device is locked (recommended)" },
          { value: "NSFileProtectionCompleteUnlessOpen", label: "Complete Unless Open — accessible until closed" },
          { value: "NSFileProtectionCompleteUntilFirstUserAuthentication", label: "Until First Auth — accessible after first unlock after reboot" },
        ],
        defaultValue: "NSFileProtectionComplete",
      },
    ],
  },
];

// State
const state = {};

function buildForm() {
  const container = document.getElementById("capabilityList");
  CAPABILITIES.forEach(cap => {
    state[cap.id] = { enabled: false, values: {} };
    if (cap.fields) {
      cap.fields.forEach(f => {
        state[cap.id].values[f.key] = f.defaultValue;
      });
    }

    const card = document.createElement("div");
    card.className = "cap-card";
    card.id = `cap_${cap.id}`;

    let fieldsHtml = "";
    if (cap.fields) {
      cap.fields.forEach(f => {
        if (f.hidden) return;
        fieldsHtml += buildField(cap.id, f);
      });
    }

    card.innerHTML = `
      <label class="cap-header">
        <input type="checkbox" data-cap="${cap.id}" onchange="toggleCap('${cap.id}', this)" />
        <span class="cap-icon">${cap.icon}</span>
        <div class="cap-info">
          <div class="cap-name">${cap.label}</div>
          <div class="cap-desc">${cap.description}</div>
          <div class="cap-req">Requires: ${cap.requires}</div>
        </div>
      </label>
      ${fieldsHtml ? `<div class="cap-fields" id="fields_${cap.id}" style="display:none">${fieldsHtml}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function buildField(capId, f) {
  const id = `field_${capId}_${f.key.replace(/\./g, "_")}`;
  let input = "";
  if (f.type === "select") {
    const opts = f.options.map(o => `<option value="${o.value}"${o.value === f.defaultValue ? " selected" : ""}>${o.label}</option>`).join("");
    input = `<select id="${id}" onchange="setFieldValue('${capId}','${f.key}',this.value)">${opts}</select>`;
  } else if (f.type === "text") {
    input = `<input type="text" id="${id}" value="${f.defaultValue || ""}" placeholder="${f.placeholder || ""}"
      oninput="setFieldValue('${capId}','${f.key}',this.value)" />`;
  } else if (f.type === "textarea") {
    input = `<textarea id="${id}" rows="3" placeholder="${f.placeholder || ""}"
      oninput="setFieldValue('${capId}','${f.key}',this.value)">${f.defaultValue || ""}</textarea>`;
  } else if (f.type === "multicheck") {
    const checks = f.options.map(o =>
      `<label class="sub-check"><input type="checkbox" value="${o.value}"
        ${(f.defaultValue || []).includes(o.value) ? "checked" : ""}
        onchange="setMulticheck('${capId}','${f.key}','${o.value}',this.checked)"> ${o.label}</label>`
    ).join("");
    input = `<div class="multichecks">${checks}</div>`;
  }
  const noteHtml = f.note ? `<div class="field-note">${f.note}</div>` : "";
  const labelHtml = f.label ? `<label class="field-label" for="${id}">${f.label}</label>` : "";
  return `<div class="field-group">${labelHtml}${input}${noteHtml}</div>`;
}

function toggleCap(id, el) {
  state[id].enabled = el.checked;
  const fieldsEl = document.getElementById(`fields_${id}`);
  if (fieldsEl) fieldsEl.style.display = el.checked ? "block" : "none";
  document.getElementById(`cap_${id}`).classList.toggle("active", el.checked);
}

function setFieldValue(capId, key, value) {
  state[capId].values[key] = value;
}

function setMulticheck(capId, key, value, checked) {
  if (!Array.isArray(state[capId].values[key])) state[capId].values[key] = [];
  if (checked) {
    if (!state[capId].values[key].includes(value)) state[capId].values[key].push(value);
  } else {
    state[capId].values[key] = state[capId].values[key].filter(v => v !== value);
  }
}

function escXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plistValue(val) {
  if (typeof val === "boolean" || val === true || val === false) {
    return val ? "<true/>" : "<false/>";
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "<array/>";
    const items = val.map(v => `        <string>${escXml(v)}</string>`).join("\n");
    return `<array>\n${items}\n    </array>`;
  }
  return `<string>${escXml(val)}</string>`;
}

function generateEntitlements() {
  // Collect all entitlements into a flat map (merge arrays if same key appears multiple times)
  const result = {};

  const enabled = CAPABILITIES.filter(cap => state[cap.id] && state[cap.id].enabled);

  enabled.forEach(cap => {
    if (cap.entitlement) {
      const { key, value, type } = cap.entitlement;
      if (type === "array") {
        if (!result[key]) result[key] = [];
        (Array.isArray(value) ? value : [value]).forEach(v => {
          if (!result[key].includes(v)) result[key].push(v);
        });
      } else {
        result[key] = value;
      }
    }
    if (cap.fields) {
      cap.fields.forEach(f => {
        const val = state[cap.id].values[f.key];
        if (f.type === "textarea") {
          // Split into array
          const lines = (typeof val === "string" ? val : f.defaultValue || "")
            .split("\n").map(l => l.trim()).filter(Boolean);
          if (!result[f.key]) result[f.key] = [];
          lines.forEach(l => { if (!result[f.key].includes(l)) result[f.key].push(l); });
        } else if (f.type === "multicheck") {
          const arr = Array.isArray(val) ? val : (f.defaultValue || []);
          if (arr.length > 0) {
            if (!result[f.key]) result[f.key] = [];
            arr.forEach(v => { if (!result[f.key].includes(v)) result[f.key].push(v); });
          }
        } else if (f.type === "bool" || f.hidden) {
          result[f.key] = val !== undefined ? val : f.defaultValue;
        } else {
          // text / select
          const v = val !== undefined ? val : f.defaultValue;
          if (v !== "" && v !== undefined) result[f.key] = v;
        }
      });
    }
  });

  if (Object.keys(result).length === 0) {
    alert("Select at least one capability first.");
    return;
  }

  const lines = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`);
  lines.push(`<plist version="1.0">`);
  lines.push(`<dict>`);

  Object.entries(result).forEach(([key, val]) => {
    lines.push(`    <key>${escXml(key)}</key>`);
    lines.push(`    ${plistValue(val)}`);
  });

  lines.push(`</dict>`);
  lines.push(`</plist>`);

  const output = lines.join("\n");
  document.getElementById("outputBox").textContent = output;
  document.getElementById("outputSection").style.display = "block";
  document.getElementById("outputSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyEntitlements() {
  const text = document.getElementById("outputBox").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = "Copy to clipboard"; }, 1800);
  });
}

function downloadEntitlements() {
  const text = document.getElementById("outputBox").textContent;
  const a = document.createElement("a");
  a.href = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
  a.download = "App.entitlements";
  a.click();
}

document.addEventListener("DOMContentLoaded", buildForm);
