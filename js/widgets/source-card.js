(function () {
    "use strict";

    function createCell(tagName, text, className) {
        const cell = document.createElement(tagName);
        cell.className = className;
        cell.textContent = text;
        return cell;
    }

    function createValueCell(value, valueClass) {
        const cell = createCell("td", value, "source-card__value");

        if (valueClass) {
            valueClass.split(" ").forEach(function (className) {
                cell.classList.add(className);
            });
        }

        return cell;
    }

    function appendRow(body, label, viewModels, getValue, getValueClass) {
        const row = document.createElement("tr");
        row.appendChild(createCell("th", label, "source-card__label"));

        viewModels.forEach(function (viewModel) {
            row.appendChild(createValueCell(
                getValue(viewModel),
                getValueClass ? getValueClass(viewModel) : ""
            ));
        });

        body.appendChild(row);
    }

    function createSourceHeading(viewModel, handlers) {
        const cell = document.createElement("th");
        const content = document.createElement("div");
        const name = document.createElement("span");
        const toggle = document.createElement("button");

        cell.className = "source-card__source-name";
        content.className = "source-card__source-heading";
        name.textContent = viewModel.sourceName;
        toggle.className = "source-card__toggle "
            + (viewModel.enabled
                ? "source-card__toggle--on"
                : "source-card__toggle--off");
        toggle.type = "button";
        toggle.textContent = viewModel.enabled
            ? viewModel.labels.sourceOn
            : viewModel.labels.sourceOff;
        toggle.setAttribute("aria-pressed", String(viewModel.enabled));
        toggle.addEventListener("click", function () {
            handlers.onToggle(viewModel.sourceName);
        });
        content.append(name, toggle);
        cell.appendChild(content);
        return cell;
    }

    function render(container, viewModels, handlers) {
        if (viewModels.length === 0) {
            container.replaceChildren();
            return;
        }

        const title = document.createElement("h2");
        const tableWrapper = document.createElement("div");
        const table = document.createElement("table");
        const head = document.createElement("thead");
        const headRow = document.createElement("tr");
        const body = document.createElement("tbody");
        const labels = viewModels[0].labels;

        title.className = "source-card__title";
        title.textContent = labels.title;
        tableWrapper.className = "source-card__table-wrapper";
        table.className = "source-card__table";

        headRow.appendChild(createCell("th", "", "source-card__corner"));
        viewModels.forEach(function (viewModel) {
            headRow.appendChild(createSourceHeading(viewModel, handlers));
        });
        head.appendChild(headRow);

        // Названия показателей создаются один раз, источники занимают отдельные колонки.
        appendRow(
            body,
            labels.status,
            viewModels,
            function (viewModel) {
                return viewModel.statusText;
            },
            function (viewModel) {
                return "source-card__status source-card__status--"
                    + viewModel.status;
            }
        );
        appendRow(body, labels.generatedAt, viewModels, function (viewModel) {
            return viewModel.generatedAt;
        });
        appendRow(body, labels.rowsCount, viewModels, function (viewModel) {
            return viewModel.rowsCount;
        });
        appendRow(
            body,
            labels.filteredRowsCount,
            viewModels,
            function (viewModel) {
                return viewModel.filteredRowsCount;
            }
        );

        table.append(head, body);
        tableWrapper.appendChild(table);
        container.replaceChildren(title, tableWrapper);
    }

    // Widget получает готовые значения от app.js и отвечает только за общий вид таблицы.
    window.SourceCard = {
        render: render
    };
}());
