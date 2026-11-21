"use strict";

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class NextUpExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = this.getSettings();

    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a new preferences row
    const row = new Adw.ActionRow({ title: "Panel to show indicator in" });
    group.add(row);

    const dropdown = new Gtk.DropDown({
      model: Gtk.StringList.new(["Left", "Center", "Right"]),
      valign: Gtk.Align.CENTER,
    });

    settings.bind(
      "which-panel",
      dropdown,
      "selected",
      Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(dropdown);
    row.activatable_widget = dropdown;

    const lookAheadRow = new Adw.SpinRow({
      title: "Only show events starting within",
      subtitle: "Minutes ahead; 0 shows all of today's events",
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 1440,
        step_increment: 15,
      }),
    });

    settings.bind(
      "look-ahead-minutes",
      lookAheadRow,
      "value",
      Gio.SettingsBindFlags.DEFAULT
    );

    group.add(lookAheadRow);

    const maxLengthRow = new Adw.SpinRow({
      title: "Maximum event name length",
      subtitle: "Characters; 0 shows the full name",
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 200,
        step_increment: 5,
      }),
    });

    settings.bind(
      "max-summary-length",
      maxLengthRow,
      "value",
      Gio.SettingsBindFlags.DEFAULT
    );

    group.add(maxLengthRow);

    // Add our page to the window
    window.add(page);
  }
}
