(function () {
    "use strict";

    // Source отвечает только за чтение выбранного пользователем файла.
    // Разбор содержимого ICS выполняется отдельно в core/worktime.js.
    function read(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();

            reader.onload = function () {
                if (typeof reader.result !== "string") {
                    reject(new Error("ICS file did not contain text."));
                    return;
                }

                resolve(reader.result);
            };
            reader.onerror = function () {
                reject(reader.error || new Error("ICS file could not be read."));
            };
            reader.readAsText(file, "UTF-8");
        });
    }

    // Публичный адаптер возвращает текст файла через Promise.
    window.IcsSource = {
        read: read
    };
}());
