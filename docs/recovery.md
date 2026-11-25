# Recovering from a bad key mapping

This page explains what to do if a remap leaves your keyboard behaving oddly, what we have actually verified, and what we have not.

## What the app does (and cannot do)

- The app **only writes** key mappings. It cannot read the keymap stored in the keyboard.
  We checked the HID descriptor of an RK837 (USB PID `0x0049`): the configuration interface exposes only feature reports, and reading them returns a constant value that does not change when keys are remapped or the mode is switched. The Rangoli project, which this codec is based on, has no read path either.
- Every change rewrites the **complete** keymap, not just the key you changed.
- The app shows the mapping saved in your browser's `localStorage`, not what is on the keyboard. If the keyboard was changed by anything else (for example the official RK software), the two can differ.

## How to get back to the default layout

1. Connect the keyboard **with the USB cable** and open the app. A mouse is enough: you do not need the remapped keys to use the page.
2. Click **Reset All Keys to Default** and confirm. This sends an empty keymap, which makes the keyboard use its factory layout. Wait for the success message.
3. Disconnect and reconnect the cable if some keys still misbehave, connect again in the app, and repeat step 2.

For a single key, select it and click **Set to Default**.

The app and the keyboard agree again after a successful Reset All, because both are then empty.

## What we verified

Tested on an RK837 (USB PID `0x0049`), wired, on macOS with Chrome:

- Remapping a key and then using **Reset All Keys to Default** restored the original function, in both the Mac and the Windows keyboard modes.
- After unplugging and replugging the cable, the app could connect again and send the reset.

## What we have not verified

- **Replacing the physical Fn key.** We deliberately did not test it. It may disable Fn combinations (media keys, lighting, mode switching), and we do not know whether Reset All fully undoes it. The app asks for confirmation before doing this and says it may be irreversible.
- **Assigning Fn to another key** does not turn that key into a real Fn key: on the RK837 it did not activate any Fn combination. The original Fn key keeps working, and Reset All cleared the mapping. The app warns about this too.
- **Other keyboard models**, and the Bluetooth and 2.4 GHz modes. Writing keymaps only works over USB.
- **A physical or hardware reset.** We found none documented for the RK837 (not in the paper manual, the PDF manual, or the manufacturer's page), so do not rely on a key combination. Do not use combinations from other RK models: they do different things (for example, on some models Fn + Space only switches between Windows and iOS modes).

If the app cannot connect at all, the official RK software on Windows is another way to rewrite the keymap. We have not tested that path.

## Safe habits when experimenting

- Use the **USB cable**, never Bluetooth.
- Change **one key at a time**, and check it works before changing the next.
- Wait for the success message before pressing anything else, and **never unplug the keyboard while a change is being sent**. An interrupted write can leave a partial keymap, which sending a full keymap again should fix.
- Keep a mouse at hand and keep the app tab open while testing.
- Avoid remapping the Fn key. If you do, accept that it may not be reversible.

## Testing a remap

A web tool such as the [W3C Key Event Viewer](https://w3c.github.io/uievents/tools/key-event-viewer.html) shows the `code` the keyboard sends for each physical key, which tells you what a remap really did. The Fn key does not generate events in the browser, and some shortcuts (such as `Cmd+Q`) are intercepted before reaching the page.
