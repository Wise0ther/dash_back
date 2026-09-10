(function () {
    "use strict";

    function createTitle(text) {
        const title = document.createElement("h2");
        title.className = "settings-panel__title";
        title.textContent = text;
        return title;
    }

    function createFileAction(text, accept, onFile) {
        const label = document.createElement("label");
        const input = document.createElement("input");

        label.className = "settings-panel__action settings-panel__action--load";
        label.textContent = text;
        input.className = "settings-panel__file";
        input.type = "file";
        input.accept = accept;
        input.addEventListener("change", function () {
            if (input.files.length > 0) {
                onFile(input.files[0]);
            }
        });
        label.appendChild(input);
        return label;
    }

    function createFontField(text, sizes, selectedSize, onChange) {
        const field = document.createElement("label");
        const select = document.createElement("select");

        field.className = "settings-panel__field";
        field.textContent = text;
        select.className = "settings-panel__select";

        sizes.forEach(function (size) {
            const option = document.createElement("option");
            option.value = String(size);
            option.textContent = size + " px";
            option.selected = size === selectedSize;
            select.appendChild(option);
        });
        select.addEventListener("change", function () {
            onChange(Number(select.value));
        });
        field.appendChild(select);
        return field;
    }

    function createLanguageField(viewModel, handlers) {
        const field = document.createElement("label");
        const select = document.createElement("select");

        field.className = "settings-panel__field";
        field.textContent = viewModel.text.language;
        select.className = "settings-panel__select";

        ["cs", "ru", "en"].forEach(function (language) {
            const option = document.createElement("option");
            option.value = language;
            option.textContent = language.toUpperCase();
            option.selected = language === viewModel.language;
            select.appendChild(option);
        });
        select.addEventListener("change", function () {
            handlers.onLanguageChange(select.value);
        });
        field.appendChild(select);
        return field;
    }

    function renderFont(container, viewModel, handlers) {
        const languageField = createLanguageField(viewModel, handlers);
        const interfaceFontField = createFontField(
            viewModel.text.interfaceFontSize,
            [10, 12, 14, 16, 18],
            viewModel.interfaceFontSize,
            handlers.onInterfaceFontSizeChange
        );
        const widgetFontField = createFontField(
            viewModel.text.widgetFontSize,
            [10, 12, 14, 16, 18, 20, 24],
            viewModel.widgetFontSize,
            handlers.onFontSizeChange
        );

        container.replaceChildren(
            createTitle(viewModel.text.fontSettingsTitle),
            languageField,
            interfaceFontField,
            widgetFontField
        );
    }

    function renderSources(container, viewModel, handlers) {
        const message = document.createElement("p");
        const addSource = createFileAction(
            viewModel.text.addSource,
            ".js,text/javascript,application/javascript",
            handlers.onSourceAdd
        );

        message.className = "settings-panel__message";
        message.textContent = viewModel.sourceMessage;
        container.replaceChildren(
            createTitle(viewModel.text.sourceSettingsTitle),
            addSource,
            message
        );
    }

    function renderSchedule(container, viewModel, handlers) {
        const scheduleStatus = document.createElement("p");
        const statusDot = document.createElement("span");
        const actions = document.createElement("div");
        const loadSchedule = createFileAction(
            viewModel.text.loadSchedule,
            ".ics,text/calendar",
            handlers.onCalendarImport
        );
        const clearButton = document.createElement("button");
        const message = document.createElement("p");

        scheduleStatus.className = "settings-panel__schedule-status";
        statusDot.className = "settings-panel__status-dot "
            + (viewModel.scheduleLoaded
                ? "settings-panel__status-dot--ready"
                : "settings-panel__status-dot--empty");
        scheduleStatus.append(
            statusDot,
            viewModel.scheduleLoaded
                ? viewModel.text.scheduleLoaded
                : viewModel.text.scheduleNotLoaded
        );

        clearButton.className = "settings-panel__action settings-panel__action--clear";
        clearButton.type = "button";
        clearButton.textContent = viewModel.text.clearSchedule;
        clearButton.disabled = !viewModel.scheduleLoaded;
        clearButton.addEventListener("click", handlers.onScheduleClear);
        actions.className = "settings-panel__actions";
        actions.append(loadSchedule, clearButton);

        message.className = "settings-panel__message";
        message.textContent = viewModel.scheduleMessage;
        container.replaceChildren(
            createTitle(viewModel.text.icsSettingsTitle),
            actions,
            scheduleStatus,
            message
        );
    }

    // Три независимых mount-point сохраняют порядок логических блоков,
    // заданный в index.html, и не смешивают сообщения разных настроек.
    function render(containers, viewModel, handlers) {
        renderFont(containers.font, viewModel, handlers);
        renderSources(containers.sources, viewModel, handlers);
        renderSchedule(containers.schedule, viewModel, handlers);
    }

    window.SettingsPanel = {
        render: render
    };
}());
