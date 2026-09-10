(function () {
    "use strict";

    // Имя проверяется до обращения к соответствующей window.*Data переменной.
    function validateSourceName(sourceName) {
        return /^[A-Za-z][A-Za-z0-9_]*$/.test(sourceName);
    }

    function validateSnapshot(snapshot) {
        // Source проверяет только внешний контракт, не интерпретируя строки.
        return snapshot !== null
            && typeof snapshot === "object"
            && typeof snapshot.generatedAt === "string"
            && Array.isArray(snapshot.rows);
    }

    function createResult(sourceName, snapshot) {
        return {
            name: sourceName,
            generatedAt: snapshot.generatedAt,
            rows: snapshot.rows,
            rowCount: snapshot.rows.length
        };
    }

    function loadScript(sourceName, url) {
        return new Promise(function (resolve, reject) {
            if (!validateSourceName(sourceName)) {
                reject(new Error("Invalid source name."));
                return;
            }

            const globalName = sourceName + "Data";
            // Динамический script позволяет загрузить snapshot через file://
            // без fetch, web-сервера и дополнительных зависимостей.
            const script = document.createElement("script");

            window[globalName] = undefined;
            script.src = url;
            script.onload = function () {
                const snapshot = window[globalName];
                // DOM-элемент после выполнения больше не нужен; сам объект
                // snapshot остаётся доступен в window.
                script.remove();

                if (!validateSnapshot(snapshot)) {
                    reject(new Error("Invalid snapshot structure."));
                    return;
                }

                resolve(createResult(sourceName, snapshot));
            };
            script.onerror = function () {
                script.remove();
                reject(new Error("Snapshot file could not be loaded."));
            };

            document.head.appendChild(script);
        });
    }

    function load(sourceName, path) {
        // Уникальный параметр заставляет браузер перечитать локальный
        // snapshot при ручном обновлении, а не брать старую копию из кэша.
        const separator = path.includes("?") ? "&" : "?";
        return loadScript(sourceName, path + separator + "_=" + Date.now());
    }

    function loadFile(file) {
        const match = /^([A-Za-z][A-Za-z0-9_]*)\.js$/i.exec(file.name);

        if (!match) {
            return Promise.reject(new Error("Invalid JS source file name."));
        }

        const sourceName = match[1];
        const objectUrl = URL.createObjectURL(file);

        return loadScript(sourceName, objectUrl).then(
            function (result) {
                URL.revokeObjectURL(objectUrl);
                return result;
            },
            function (error) {
                URL.revokeObjectURL(objectUrl);
                throw error;
            }
        );
    }

    // App.js получает snapshot только через этот публичный адаптер.
    window.JsSource = {
        load: load,
        loadFile: loadFile
    };
}());
