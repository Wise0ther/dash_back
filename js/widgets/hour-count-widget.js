(function () {
    "use strict";

    function createCell(tagName, text, className) {
        const cell = document.createElement(tagName);
        cell.className = className;
        cell.textContent = text;
        return cell;
    }

    function createCard(viewModel, handlers) {
        const card = document.createElement("article");
        const header = document.createElement("header");
        const title = document.createElement("h2");
        const refreshButton = document.createElement("button");
        const table = document.createElement("table");
        const tableHead = document.createElement("thead");
        const headingRow = document.createElement("tr");
        const tableBody = document.createElement("tbody");
        const tableFoot = document.createElement("tfoot");
        const totalRow = document.createElement("tr");

        card.className = "hour-count-card";
        card.style.setProperty(
            "--widget-data-font-size",
            viewModel.fontSize + "px"
        );
        header.className = "hour-count-card__header";
        title.className = "hour-count-card__title";
        title.textContent = viewModel.title;

        refreshButton.className = "hour-count-card__refresh";
        refreshButton.type = "button";
        refreshButton.textContent = "🔄";
        refreshButton.disabled = viewModel.loading;
        refreshButton.title = viewModel.refreshText;
        refreshButton.setAttribute("aria-label", viewModel.refreshText);
        refreshButton.addEventListener("click", function () {
            handlers.onRefresh(viewModel.sourceName);
        });
        header.append(title, refreshButton);

        table.className = "hour-count-card__table";
        headingRow.append(
            createCell(
                "th",
                viewModel.hourLabel,
                "hour-count-card__heading"
            ),
            createCell(
                "th",
                viewModel.dateLabel + ": " + viewModel.date,
                "hour-count-card__heading hour-count-card__heading--count"
            )
        );
        tableHead.appendChild(headingRow);

        viewModel.rows.forEach(function (row) {
            const tableRow = document.createElement("tr");
            tableRow.append(
                createCell("td", row.hour, "hour-count-card__cell"),
                createCell(
                    "td",
                    String(row.count),
                    "hour-count-card__cell hour-count-card__cell--count"
                )
            );
            tableBody.appendChild(tableRow);
        });

        totalRow.append(
            createCell(
                "th",
                viewModel.totalLabel,
                "hour-count-card__total"
            ),
            createCell(
                "td",
                String(viewModel.total),
                "hour-count-card__total hour-count-card__cell--count"
            )
        );
        tableFoot.appendChild(totalRow);
        table.append(tableHead, tableBody, tableFoot);
        card.append(header, table);
        return card;
    }

    // Каждый источник снова отображается собственным независимым виджетом.
    function render(container, viewModels, handlers) {
        const fragment = document.createDocumentFragment();

        viewModels.forEach(function (viewModel) {
            fragment.appendChild(createCard(viewModel, handlers));
        });

        container.replaceChildren(fragment);
    }

    window.HourCountWidget = {
        render: render
    };
}());
