# Recovering from a bad key mapping

This page explains what to do if a remap leaves your keyboard behaving oddly, how to protect your mapping, what we have actually verified, and what we have not.

## What the app does (and cannot do)

- The app **only writes** key mappings. It cannot read the keymap stored in the keyboard.
  We checked the HID descriptor of an RK837 (USB PID `0x0049`): the configuration interface exposes only feature reports, and reading them returns a constant value that does not change when keys are remapped or the mode is switched. The Rangoli project, which this codec is based on, has no read path either.
- Every change rewrites the **complete** keymap, not just the key you changed.
- The app shows the mapping saved in your browser's `localStorage`, not what is on the keyboard. If the keyboard was changed by anything else (for example the official RK software), the two can differ.

## Mac and Windows modes

Observed on an RK837:

- There is a **single keymap** for both modes. A remap applies in Mac mode and in Windows mode.
- Remapping other keys (for example Q) does not affect the mode switch: Ctrl, Alt and Win/Cmd stay different in each mode.
- Once you **remap Ctrl, Alt or Win/Cmd**, that key does the same in both modes.
- After **Reset All Keys to Default**, each mode goes back to its own layout.

The app cannot tell which mode the keyboard is in.

## How to get back to the default layout

1. Connect the keyboard **with the USB cable** and open the app. A mouse is enough: you do not need the remapped keys to use the page.
2. Click **Reset All Keys to Default** and confirm. This clears your custom mappings and writes the complete keymap using the default codes from the model's configuration. Wait for the success message.
3. Disconnect and reconnect the cable if some keys still misbehave, connect again in the app, and repeat step 2.

For a single key, select it and click **Set to Default**.

The app and the keyboard agree again after a successful Reset All, because neither has custom mappings.

To get your own remaps back afterwards, import a backup (see below).

## Back up your mapping

Your mapping only exists in this browser: clearing its data loses it, and it cannot be read from the keyboard. Keep a backup file.

**Export backup** downloads a JSON file with:

- the **remapped** keys;
- the **confirmed** keys, listed separately for Windows and Mac mode;
- the keyboard model and the date.

It holds what the app has saved, which may differ from what is on the keyboard. Lighting settings are not included. There is one list of remaps because the keyboard has one keymap for both modes.

**Import backup…** checks the file first. It is rejected if it is not a valid backup, is for another keyboard model, has no list of remaps, or contains unknown or repeated keys or unknown key codes. Then a preview shows which keys would change and which are confirmed, with any warnings. **Nothing is written until you click Write to keyboard.** From that dialog, **Export current first** saves what you have now.

- Importing **replaces the whole keymap**: a key that is not remapped in the file goes back to its default. A file with no remaps resets every key.
- After a successful write, the confirmed keys in the file **replace** your current ones. They look like keys you just checked, so remove the mark and confirm again if in doubt.
- Backups made by an earlier version, without confirmed keys, can still be imported. Your confirmations stay, except on keys that end up remapped.

## Check what your keys do

In the drawing, a key is in one of three states:

| State | Meaning |
|---|---|
| **Unconfirmed** (faded name) | What the key should do according to the model's configuration. Not checked. |
| **Confirmed** (check mark) | You checked it. |
| **Remapped** (tinted) | The app assigned it another function. Remapped keys cannot be confirmed. |

To confirm keys, turn on **Confirmation mode**, click a key in the drawing and press that same key. It is confirmed if the browser receives the expected code. Otherwise it stays unconfirmed and the app shows what arrived. Confirmation mode itself writes nothing to the keyboard, but **Reset All** and **Import backup** are still available and do write.

- For keys the browser cannot detect, such as Fn and media keys, check them yourself and click **Mark as confirmed**.
- The app cannot tell which physical key sent a code, so press only the one you selected.
- macOS settings can change what arrives. On the keyboard we tested, the ISO `< >` key was reported as `Backquote`.
- Confirmations are kept separately for Windows and Mac, following **Key names**. The app cannot detect the keyboard's mode, so set both to the same one.
- Remapping a key removes its confirmation in both modes.

**Layout** and **Key names** only change the names and order shown on screen, not what is sent to the keyboard. The drawing follows the model's configuration, so in Mac mode some modifier positions may not match. Some models cannot be drawn and show the product image instead, without confirmation.

## Warnings before risky remaps

The app asks for confirmation before it:

- **replaces the Fn key** (strong warning: risky and possibly irreversible);
- **assigns Fn to another key** (it probably will not work as a real Fn key);
- **replaces a Ctrl, Alt or Win/Cmd key** (it will then do the same in Mac and Windows modes).

The import preview shows the same warnings for what the file contains. Cancelling writes nothing.

## What we verified

Tested on an RK837 (USB PID `0x0049`), wired, on macOS with Chrome:

- Remapping a key and then using **Reset All Keys to Default** restored the original function, in both the Mac and the Windows keyboard modes.
- After unplugging and replugging the cable, the app could connect again and send the reset.
- Assigning the ISO key (`< >`) to a key worked: it typed `<` and, with Shift, `>`.

## What we have not verified

- **Backups, key confirmation and the keyboard drawing with a physical keyboard.** They have only been tried in demo mode, with simulated key presses. This includes whether confirmations are still there after reloading the page, since demo mode does not save them. Until you have checked a restore yourself, do not treat a backup as your only way back.
- **Replacing the physical Fn key.** We deliberately did not test it. It may disable Fn combinations (media keys, lighting, mode switching), and we do not know whether Reset All fully undoes it.
- **Assigning Fn to another key** does not turn that key into a real Fn key: on the RK837 it did not activate any Fn combination. The original Fn key keeps working, and Reset All cleared the mapping.
- **Other keyboard models**, and the Bluetooth and 2.4 GHz modes. Writing keymaps only works over USB.
- **A physical or hardware reset.** We found none documented for the RK837 (not in the paper manual, the PDF manual, or the manufacturer's page), so do not rely on a key combination. Do not use combinations from other RK models: they do different things (for example, on some models Fn + Space only switches between Windows and iOS modes).

If the app cannot connect at all, the official RK software on Windows is another way to rewrite the keymap. We have not tested that path.

## Safe habits when experimenting

- Use the **USB cable**, never Bluetooth.
- Change **one key at a time**, and check it works before changing the next.
- Wait for the success message before pressing anything else, and **never unplug the keyboard while a change is being sent**. An interrupted write can leave a partial keymap, which sending a full keymap again should fix.
- Keep a mouse at hand and keep the app tab open while testing.
- Export a backup before experimenting.
- Avoid remapping the Fn key. If you do, accept that it may not be reversible.

## Testing a remap

A web tool such as the [W3C Key Event Viewer](https://w3c.github.io/uievents/tools/key-event-viewer.html) shows the `code` the keyboard sends for each physical key, which tells you what a remap really did. The Fn key does not generate events in the browser, and some shortcuts (such as `Cmd+Q`) are intercepted before reaching the page.
