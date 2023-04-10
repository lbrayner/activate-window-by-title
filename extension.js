/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Gio } = imports.gi;

const ActivateWindowByTitleInterface = `
<node>
  <interface name="de.lucaswerkmeister.ActivateWindowByTitle">
    <method name="activateByTitle">
      <arg name="fullTitle" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateByPrefix">
      <arg name="prefix" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateBySuffix">
      <arg name="suffix" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateBySubstring">
      <arg name="substring" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateByWmClass">
      <arg name="name" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateByWmClassInstance">
      <arg name="instance" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
  </interface>
</node>
`;

class ActivateWindowByTitle {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(
            ActivateWindowByTitleInterface,
            this,
        );
        this._dbus.export(
            Gio.DBus.session,
            '/de/lucaswerkmeister/ActivateWindowByTitle',
        );
    }

    disable() {
        this._dbus.unexport_from_connection(
            Gio.DBus.session,
        );
        this._dbus = undefined;
    }

    constructor() {
        this._activateByPredicate = function(predicate) {
            for (const actor of global.get_window_actors()) {
                const window = actor.get_meta_window();
                if (predicate(window)) {
                    window.activate(global.get_current_time());
                    return true;
                }
            }
            return false;
        }

        this._activateByTitlePredicate = function(predicate) {
            return this._activateByPredicate((window) => {
                const title = window.get_title();
                if (title === null) {
                    return false;
                }
                return predicate(title);
            });
        }
    }

    activateByTitle(fullTitle) {
        return this._activateByTitlePredicate(
            (title) => title === fullTitle,
        );
    }

    activateByPrefix(prefix) {
        return this._activateByTitlePredicate(
            (title) => title.startsWith(prefix),
        );
    }

    activateBySuffix(suffix) {
        return this._activateByTitlePredicate(
            (title) => title.endsWith(suffix),
        );
    }

    activateBySubstring(substring) {
        return this._activateByTitlePredicate(
            (title) => title.includes(substring),
        );
    }

    // note: we don’t offer activateByRegExp,
    // because that would be vulnerable to ReDoS attacks

    activateByWmClass(name) {
        return this._activateByPredicate(
            (window) => window.get_wm_class() === name,
        );
    }

    activateByWmClassInstance(instance) {
        return this._activateByPredicate(
            (window) => window.get_wm_class_instance() === instance,
        );
    }
}

function init() {
    return new ActivateWindowByTitle();
}
