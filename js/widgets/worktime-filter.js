(function () {
    "use strict";

    // Создаёт одно подписанное нативное поле date/time.
    function createField(form, labelText, name, type, value, onChange) {
        const label = document.createElement("label");
        const input = document.createElement("input");

        label.className = "dashboard-toolbar__field";
        label.textContent = labelText;
        input.className = "dashboard-toolbar__input";
        input.name = name;
        input.type = type;
        input.value = value || "";
        input.addEventListener("change", onChange);
        label.appendChild(input);
        form.appendChild(label);
    }

    function readFilter(form) {
        // Widget возвращает введённые значения без проверки и расчётов.
        const formData = new FormData(form);

        return {
            startDate: formData.get("startDate") || "",
            endDate: formData.get("endDate") || "",
            startTime: formData.get("startTime") || "",
            endTime: formData.get("endTime") || ""
        };
    }

    function createModeOption(group, text, value, selected, onChange) {
        const label = document.createElement("label");
        const input = document.createElement("input");

        label.className = "dashboard-toolbar__mode";
        input.type = "radio";
        input.name = "worktimeMode";
        input.value = value;
        input.checked = selected;
        input.addEventListener("change", function () {
            if (input.checked) {
                onChange(value);
            }
        });
        label.append(input, text);
        group.appendChild(label);
    }

    function render(container, viewModel, handlers) {
        // Вся реакция на действия передаётся координатору через handlers.
        const title = document.createElement("span");
        const form = document.createElement("form");
        const fields = document.createElement("div");
        const modes = document.createElement("fieldset");
        const refreshAllButton = document.createElement("button");
        const settingsButton = document.createElement("button");

        title.className = "dashboard-toolbar__title";
        title.textContent = viewModel.text.filtersTitle;
        form.className = "dashboard-toolbar__form";
        form.addEventListener("submit", function (event) {
            event.preventDefault();
        });
        fields.className = "dashboard-toolbar__fields";

        function handleManualChange() {
            // Изменение любого поля передаёт app.js весь текущий интервал.
            handlers.onManualChange(readFilter(form));
        }

        createField(fields, viewModel.text.startDate, "startDate", "date", viewModel.filter.startDate, handleManualChange);
        createField(fields, viewModel.text.endDate, "endDate", "date", viewModel.filter.endDate, handleManualChange);
        createField(fields, viewModel.text.startTime, "startTime", "time", viewModel.filter.startTime, handleManualChange);
        createField(fields, viewModel.text.endTime, "endTime", "time", viewModel.filter.endTime, handleManualChange);

        modes.className = "dashboard-toolbar__modes";
        createModeOption(modes, viewModel.text.manualMode, "manual", viewModel.mode === "manual", handlers.onModeChange);
        createModeOption(modes, viewModel.text.scheduleMode, "calendar", viewModel.mode === "calendar", handlers.onModeChange);

        refreshAllButton.className = "dashboard-toolbar__refresh-all";
        refreshAllButton.type = "button";
        refreshAllButton.textContent = viewModel.text.refreshAll;
        refreshAllButton.disabled = viewModel.loading;
        refreshAllButton.addEventListener("click", handlers.onRefreshAll);

        settingsButton.className = "dashboard-toolbar__settings";
        settingsButton.type = "button";
        settingsButton.textContent = "⚙";
        settingsButton.title = viewModel.text.settings;
        settingsButton.setAttribute("aria-label", viewModel.text.settings);
        settingsButton.setAttribute("aria-expanded", String(viewModel.settingsOpen));
        settingsButton.addEventListener("click", handlers.onSettingsToggle);

        form.append(title, fields, modes, refreshAllButton);
        container.replaceChildren(form, settingsButton);
    }

    // Widget отвечает только за построение и обновление своего DOM-блока.
    window.WorktimeFilter = {
        render: render
    };
}());
