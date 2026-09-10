(function () {
    "use strict";

    const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function formatDate(date) {
        return [
            pad(date.getDate()),
            pad(date.getMonth() + 1),
            pad(date.getFullYear() % 100)
        ].join(".");
    }

    function formatHourEnd(date) {
        return pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    // Формирует последовательные часовые интервалы от начала до конца смены.
    // Меткой каждой строки является именно конец соответствующего часа.
    function build(rows, interval) {
        if (!interval || interval.start >= interval.end) {
            return { date: "", rows: [], total: 0 };
        }

        const result = [];
        let bucketStart = new Date(interval.start.getTime());
        let firstBucket = true;
        let total = 0;

        while (bucketStart < interval.end) {
            const bucketEnd = new Date(Math.min(
                bucketStart.getTime() + HOUR_IN_MILLISECONDS,
                interval.end.getTime()
            ));
            const count = rows.reduce(function (sum, row) {
                const timestamp = new Date(row[0]);

                if (Number.isNaN(timestamp.getTime())) {
                    return sum;
                }

                // Первая строка включает начало смены. В следующих строках
                // нижняя граница открыта, чтобы 19:00:00 осталось в строке
                // «19:00», а 19:00:01 попало уже в следующий час.
                const afterStart = firstBucket
                    ? timestamp >= bucketStart
                    : timestamp > bucketStart;

                return afterStart && timestamp <= bucketEnd ? sum + 1 : sum;
            }, 0);

            result.push({
                hour: formatHourEnd(bucketEnd),
                count: count
            });
            total += count;
            bucketStart = bucketEnd;
            firstBucket = false;
        }

        return {
            date: formatDate(interval.start),
            rows: result,
            total: total
        };
    }

    // Core возвращает готовые почасовые данные и не создаёт DOM.
    window.HourCount = {
        build: build
    };
}());
