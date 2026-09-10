(function () {
    "use strict";

    // Версия в имени ключа позволит явно отделить будущий формат настроек.
    const FILTER_KEY = "dashboard.worktime.filter.v1";
    const CALENDAR_KEY = "dashboard.worktime.calendar.v1";
    const MODE_KEY = "dashboard.worktime.mode.v1";
    const WIDGET_FONT_SIZE_KEY = "dashboard.widget.font-size.v1";
    const INTERFACE_FONT_SIZE_KEY = "dashboard.interface.font-size.v1";
    const IMPORTED_SOURCES_KEY = "dashboard.sources.imported.v1";
    const DISABLED_SOURCES_KEY = "dashboard.sources.disabled.v1";
    const LANGUAGE_KEY = "dashboard.interface.language.v1";

    function read(key, fallback) {
        try {
            const value = window.localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            // При недоступном или повреждённом localStorage приложение
            // продолжает работу со значением по умолчанию.
            console.error(error);
            return fallback;
        }
    }

    function write(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            // Ошибка сохранения не должна останавливать текущую сессию.
            console.error(error);
            return false;
        }
    }

    function remove(key) {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (error) {
            // Очистка настроек, как и сохранение, не прерывает приложение.
            console.error(error);
            return false;
        }
    }

    function loadFilter() {
        return read(FILTER_KEY, null);
    }

    function saveFilter(filter) {
        return write(FILTER_KEY, filter);
    }

    function loadCalendar() {
        return read(CALENDAR_KEY, "");
    }

    function saveCalendar(content) {
        return write(CALENDAR_KEY, content);
    }

    function clearCalendar() {
        return remove(CALENDAR_KEY);
    }

    function loadMode() {
        const mode = read(MODE_KEY, "manual");
        return mode === "calendar" ? "calendar" : "manual";
    }

    function saveMode(mode) {
        return write(MODE_KEY, mode === "calendar" ? "calendar" : "manual");
    }

    function loadWidgetFontSize() {
        const size = Number(read(WIDGET_FONT_SIZE_KEY, 12));
        return [10, 12, 14, 16, 18, 20, 24].includes(size) ? size : 12;
    }

    function saveWidgetFontSize(size) {
        return write(WIDGET_FONT_SIZE_KEY, Number(size));
    }

    function loadInterfaceFontSize() {
        const size = Number(read(INTERFACE_FONT_SIZE_KEY, 12));
        return [10, 12, 14, 16, 18].includes(size) ? size : 12;
    }

    function saveInterfaceFontSize(size) {
        return write(INTERFACE_FONT_SIZE_KEY, Number(size));
    }

    function loadLanguage() {
        const language = read(LANGUAGE_KEY, "cs");
        return ["cs", "ru", "en"].includes(language) ? language : "cs";
    }

    function saveLanguage(language) {
        return write(
            LANGUAGE_KEY,
            ["cs", "ru", "en"].includes(language) ? language : "cs"
        );
    }

    function loadImportedSources() {
        const sources = read(IMPORTED_SOURCES_KEY, []);
        return Array.isArray(sources) ? sources : [];
    }

    function saveImportedSources(sources) {
        return write(IMPORTED_SOURCES_KEY, sources);
    }

    function loadDisabledSources() {
        const sourceNames = read(DISABLED_SOURCES_KEY, []);
        return Array.isArray(sourceNames)
            ? sourceNames.filter(function (sourceName) {
                return typeof sourceName === "string";
            })
            : [];
    }

    function saveDisabledSources(sourceNames) {
        return write(DISABLED_SOURCES_KEY, sourceNames);
    }

    // Публичный интерфейс скрывает конкретные ключи localStorage от app.js.
    window.DashboardStorage = {
        loadFilter: loadFilter,
        saveFilter: saveFilter,
        loadCalendar: loadCalendar,
        saveCalendar: saveCalendar,
        clearCalendar: clearCalendar,
        loadMode: loadMode,
        saveMode: saveMode,
        loadWidgetFontSize: loadWidgetFontSize,
        saveWidgetFontSize: saveWidgetFontSize,
        loadInterfaceFontSize: loadInterfaceFontSize,
        saveInterfaceFontSize: saveInterfaceFontSize,
        loadLanguage: loadLanguage,
        saveLanguage: saveLanguage,
        loadImportedSources: loadImportedSources,
        saveImportedSources: saveImportedSources,
        loadDisabledSources: loadDisabledSources,
        saveDisabledSources: saveDisabledSources
    };
}());
