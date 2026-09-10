(function () {
    "use strict";

    // Значение с Z читается как UTC, а время без Z — как локальное время
    // рабочего компьютера, что соответствует формату приведённого ICS.
    function parseIcsDate(value) {
        const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);

        if (!match) {
            return null;
        }

        const parts = match.slice(1, 7).map(function (part) {
            return Number(part || 0);
        });
        const date = match[7]
            ? new Date(Date.UTC(
                parts[0], parts[1] - 1, parts[2],
                parts[3], parts[4], parts[5]
            ))
            : new Date(
                parts[0], parts[1] - 1, parts[2],
                parts[3], parts[4], parts[5]
            );

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function parseCalendar(content) {
        // Переносы строк, начинающиеся с пробела или табуляции, являются
        // продолжением предыдущей строки согласно формату iCalendar.
        const unfolded = content
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n[ \t]/g, "");
        const intervals = [];
        let event = null;

        // Для фильтра нужны только DTSTART и DTEND. Названия событий и
        // остальные свойства календаря намеренно не извлекаются.
        unfolded.split("\n").forEach(function (line) {
            if (line === "BEGIN:VEVENT") {
                event = {};
                return;
            }

            if (line === "END:VEVENT") {
                if (event
                    && event.start instanceof Date
                    && event.end instanceof Date
                    && event.start < event.end) {
                    intervals.push(event);
                }
                event = null;
                return;
            }

            if (!event) {
                return;
            }

            const separator = line.indexOf(":");

            if (separator === -1) {
                return;
            }

            const property = line.slice(0, separator).split(";")[0].toUpperCase();
            const value = line.slice(separator + 1).trim();

            if (property === "DTSTART") {
                event.start = parseIcsDate(value);
            } else if (property === "DTEND") {
                event.end = parseIcsDate(value);
            }
        });

        return intervals.sort(function (left, right) {
            return left.start - right.start;
        });
    }

    function findCurrentInterval(intervals, now) {
        const currentTime = (now || new Date()).getTime();

        return intervals.find(function (interval) {
            // Конец интервала не включается: следующая смена может начинаться
            // точно в момент завершения предыдущей.
            return interval.start.getTime() <= currentTime
                && currentTime < interval.end.getTime();
        }) || null;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function formatDateInput(date) {
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join("-");
    }

    function formatTimeInput(date) {
        return pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    // Форматирует временную метку для интерфейса без зависимости от локали:
    // DD.MM.YY HH:NN:SS, где NN — минуты.
    function formatDateTime(value) {
        const date = value instanceof Date ? value : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return [
            pad(date.getDate()),
            pad(date.getMonth() + 1),
            pad(date.getFullYear() % 100)
        ].join(".") + " " + [
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join(":");
    }

    function intervalToFilter(interval) {
        // Начало и конец преобразуются в значения нативных полей date/time.
        return {
            startDate: formatDateInput(interval.start),
            endDate: formatDateInput(interval.end),
            startTime: formatTimeInput(interval.start),
            endTime: formatTimeInput(interval.end)
        };
    }

    function createFilterInterval(filter) {
        // Фильтр считается активным только при наличии всех четырёх частей.
        if (!filter
            || !filter.startDate
            || !filter.endDate
            || !filter.startTime
            || !filter.endTime) {
            return null;
        }

        const start = new Date(filter.startDate + "T" + filter.startTime + ":00");
        const end = new Date(filter.endDate + "T" + filter.endTime + ":00");

        if (Number.isNaN(start.getTime())
            || Number.isNaN(end.getTime())
            || start >= end) {
            return null;
        }

        return { start: start, end: end };
    }

    function filterRows(rows, filter) {
        const interval = createFilterInterval(filter);

        if (!interval) {
            return rows.slice();
        }

        return rows.filter(function (row) {
            // В контракте Test211 временная метка записи находится в row[0].
            const timestamp = new Date(row[0]);
            return !Number.isNaN(timestamp.getTime())
                && interval.start <= timestamp
                && timestamp < interval.end;
        });
    }

    // Core возвращает вычисления координатору и не обращается к DOM.
    window.Worktime = {
        parseCalendar: parseCalendar,
        findCurrentInterval: findCurrentInterval,
        intervalToFilter: intervalToFilter,
        formatDateTime: formatDateTime,
        createFilterInterval: createFilterInterval,
        filterRows: filterRows
    };
}());
