(function () {
    "use strict";

    const EMPTY_VALUE = "—";
    const EMPTY_FILTER = {
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: ""
    };
    const disabledSourceNames = window.DashboardStorage.loadDisabledSources();
    const sources = [
        {
            name: "Test211",
            path: "data/Test211.js",
            file: null,
            imported: false,
            data: null,
            status: "loading",
            enabled: !disabledSourceNames.includes("Test211")
        }
    ];

    let manualFilter = window.DashboardStorage.loadFilter() || EMPTY_FILTER;
    let activeFilter = manualFilter;
    let calendarEvents = [];
    let mode = window.DashboardStorage.loadMode();
    let widgetFontSize = window.DashboardStorage.loadWidgetFontSize();
    let interfaceFontSize = window.DashboardStorage.loadInterfaceFontSize();
    let language = window.DashboardStorage.loadLanguage();
    let scheduleMessage = "";
    let sourceMessage = "";

    function restoreImportedSources() {
        window.DashboardStorage.loadImportedSources().forEach(function (stored) {
            const validName = typeof stored.name === "string"
                && /^[A-Za-z][A-Za-z0-9_]*$/.test(stored.name);
            const validData = stored.data
                && typeof stored.data.generatedAt === "string"
                && Array.isArray(stored.data.rows);
            const duplicate = sources.some(function (source) {
                return source.name === stored.name;
            });

            if (!validName || !validData || duplicate) {
                return;
            }

            sources.push({
                name: stored.name,
                path: "",
                file: null,
                imported: true,
                data: {
                    generatedAt: stored.data.generatedAt,
                    rows: stored.data.rows,
                    rowCount: stored.data.rows.length
                },
                status: "ready",
                enabled: !disabledSourceNames.includes(stored.name)
            });
        });
    }

    function persistImportedSources() {
        const stored = sources.filter(function (source) {
            return source.imported && source.data;
        }).map(function (source) {
            return {
                name: source.name,
                data: {
                    generatedAt: source.data.generatedAt,
                    rows: source.data.rows
                }
            };
        });

        return window.DashboardStorage.saveImportedSources(stored);
    }

    function loadStoredCalendar() {
        const content = window.DashboardStorage.loadCalendar();

        if (content) {
            calendarEvents = window.Worktime.parseCalendar(content);
        }
    }

    function activateCalendarFilter(text) {
        const currentInterval = window.Worktime.findCurrentInterval(calendarEvents);

        if (currentInterval) {
            activeFilter = window.Worktime.intervalToFilter(currentInterval);
            scheduleMessage = text.calendarFilterActive;
            return;
        }

        activeFilter = manualFilter;
        scheduleMessage = calendarEvents.length > 0
            ? text.calendarImported
            : text.noCalendar;
    }

    function createSourceViewModel(text, source) {
        const interval = window.Worktime.createFilterInterval(activeFilter);
        const filteredRows = source.data && interval
            ? window.Worktime.filterRows(source.data.rows, activeFilter)
            : null;
        const generatedAt = source.data
            ? window.Worktime.formatDateTime(source.data.generatedAt)
            : null;

        return {
            title: source.name,
            labels: {
                title: text.sourcesTitle,
                source: text.source,
                status: text.status,
                generatedAt: text.generatedAt,
                rowsCount: text.rowsCount,
                filteredRowsCount: text.filteredRowsCount,
                sourceOn: text.sourceOn,
                sourceOff: text.sourceOff
            },
            sourceName: source.name,
            enabled: source.enabled,
            status: source.status,
            statusText: text[source.status],
            generatedAt: generatedAt || EMPTY_VALUE,
            rowsCount: source.data ? String(source.data.rowCount) : EMPTY_VALUE,
            filteredRowsCount: filteredRows
                ? String(filteredRows.length)
                : EMPTY_VALUE
        };
    }

    function createHourCountViewModels(text) {
        const interval = window.Worktime.createFilterInterval(activeFilter);
        return sources.filter(function (source) {
            return source.enabled;
        }).map(function (source) {
            const report = interval
                ? window.HourCount.build(source.data ? source.data.rows : [], interval)
                : { date: "", rows: [], total: 0 };

            return {
                sourceName: source.name,
                title: source.name,
                date: report.date || EMPTY_VALUE,
                hourLabel: text.hour,
                dateLabel: text.date,
                totalLabel: text.total,
                fontSize: widgetFontSize,
                rows: report.rows,
                total: report.total,
                loading: source.status === "loading",
                refreshText: text.refresh
            };
        });
    }

    function initializeDashboard() {
        const dashboard = document.getElementById("dashboard");
        const filterContainer = document.getElementById("worktime-filter");
        const settingsPanel = document.getElementById("settings-panel");
        const fontSettings = document.getElementById("settings-font");
        const sourceSettings = document.getElementById("settings-sources");
        const scheduleSettings = document.getElementById("settings-schedule");
        const hourCountContainer = document.getElementById("hour-count-widgets");
        const sourceStatus = document.getElementById("source-status");
        let text = window.DashboardDictionary[language]
            || window.DashboardDictionary.cs;
        let settingsOpen = false;

        if (!dashboard
            || !filterContainer
            || !settingsPanel
            || !fontSettings
            || !sourceSettings
            || !scheduleSettings
            || !hourCountContainer
            || !sourceStatus) {
            console.error("Dashboard containers were not found.");
            return;
        }

        restoreImportedSources();
        loadStoredCalendar();

        if (mode === "calendar") {
            activateCalendarFilter(text);
        } else {
            scheduleMessage = text.manualFilterActive;
        }

        function findSource(sourceName) {
            return sources.find(function (source) {
                return source.name === sourceName;
            }) || null;
        }

        function render() {
            const loading = sources.some(function (source) {
                return source.status === "loading";
            });

            dashboard.style.setProperty(
                "--interface-font-size",
                interfaceFontSize + "px"
            );
            document.documentElement.lang = language;
            document.title = text.pageTitle;
            settingsPanel.hidden = !settingsOpen;
            window.WorktimeFilter.render(
                filterContainer,
                {
                    text: text,
                    filter: activeFilter,
                    mode: mode,
                    settingsOpen: settingsOpen,
                    loading: loading
                },
                {
                    onManualChange: handleManualChange,
                    onModeChange: handleModeChange,
                    onRefreshAll: refreshAllSources,
                    onSettingsToggle: function () {
                        settingsOpen = !settingsOpen;
                        render();
                    }
                }
            );

            window.SettingsPanel.render(
                {
                    font: fontSettings,
                    sources: sourceSettings,
                    schedule: scheduleSettings
                },
                {
                    text: text,
                    language: language,
                    scheduleLoaded: calendarEvents.length > 0,
                    interfaceFontSize: interfaceFontSize,
                    widgetFontSize: widgetFontSize,
                    sourceMessage: sourceMessage,
                    scheduleMessage: scheduleMessage
                },
                {
                    onCalendarImport: handleCalendarImport,
                    onScheduleClear: handleScheduleClear,
                    onLanguageChange: handleLanguageChange,
                    onInterfaceFontSizeChange: handleInterfaceFontSizeChange,
                    onFontSizeChange: handleFontSizeChange,
                    onSourceAdd: handleSourceAdd
                }
            );

            window.SourceCard.render(
                sourceStatus,
                sources.map(function (source) {
                    return createSourceViewModel(text, source);
                }),
                {
                    onToggle: handleSourceToggle
                }
            );

            window.HourCountWidget.render(
                hourCountContainer,
                createHourCountViewModels(text),
                {
                    onRefresh: function (sourceName) {
                        const source = findSource(sourceName);
                        if (source) {
                            requestSource(source).catch(function () {
                                // Ошибка отражена в техническом статусе.
                            });
                        }
                    }
                }
            );
        }

        function handleManualChange(filter) {
            manualFilter = filter;
            activeFilter = filter;
            mode = "manual";
            window.DashboardStorage.saveFilter(manualFilter);
            window.DashboardStorage.saveMode(mode);
            scheduleMessage = window.Worktime.createFilterInterval(filter)
                || !filter.startDate
                || !filter.endDate
                || !filter.startTime
                || !filter.endTime
                ? text.manualFilterActive
                : text.invalidFilter;
            render();
        }

        function handleModeChange(nextMode) {
            if (nextMode === "calendar" && calendarEvents.length === 0) {
                mode = "manual";
                activeFilter = manualFilter;
                scheduleMessage = text.noCalendar;
                settingsOpen = true;
            } else if (nextMode === "calendar") {
                mode = "calendar";
                activateCalendarFilter(text);
            } else {
                mode = "manual";
                activeFilter = manualFilter;
                scheduleMessage = text.manualFilterActive;
            }

            window.DashboardStorage.saveMode(mode);
            render();
        }

        function handleCalendarImport(file) {
            window.IcsSource.read(file)
                .then(function (content) {
                    const importedEvents = window.Worktime.parseCalendar(content);

                    if (importedEvents.length === 0) {
                        throw new Error("Invalid ICS calendar.");
                    }

                    calendarEvents = importedEvents;
                    mode = "calendar";
                    window.DashboardStorage.saveCalendar(content);
                    window.DashboardStorage.saveMode(mode);
                    activateCalendarFilter(text);
                    render();
                })
                .catch(function (error) {
                    console.error(error);
                    scheduleMessage = error.message === "Invalid ICS calendar."
                        ? text.invalidCalendar
                        : text.calendarReadError;
                    render();
                });
        }

        function handleScheduleClear() {
            calendarEvents = [];
            mode = "manual";
            activeFilter = manualFilter;
            scheduleMessage = text.scheduleCleared;
            window.DashboardStorage.clearCalendar();
            window.DashboardStorage.saveMode(mode);
            render();
        }

        function handleFontSizeChange(size) {
            widgetFontSize = size;
            window.DashboardStorage.saveWidgetFontSize(size);
            render();
        }

        function handleInterfaceFontSizeChange(size) {
            interfaceFontSize = size;
            window.DashboardStorage.saveInterfaceFontSize(size);
            render();
        }

        function handleLanguageChange(nextLanguage) {
            language = window.DashboardDictionary[nextLanguage]
                ? nextLanguage
                : "cs";
            text = window.DashboardDictionary[language];
            window.DashboardStorage.saveLanguage(language);
            sourceMessage = "";

            if (mode === "calendar") {
                activateCalendarFilter(text);
            } else {
                scheduleMessage = window.Worktime.createFilterInterval(manualFilter)
                    || !manualFilter.startDate
                    || !manualFilter.endDate
                    || !manualFilter.startTime
                    || !manualFilter.endTime
                    ? text.manualFilterActive
                    : text.invalidFilter;
            }

            render();
        }

        function handleSourceToggle(sourceName) {
            const source = findSource(sourceName);

            if (!source) {
                return;
            }

            source.enabled = !source.enabled;
            window.DashboardStorage.saveDisabledSources(
                sources.filter(function (item) {
                    return !item.enabled;
                }).map(function (item) {
                    return item.name;
                })
            );
            render();
        }

        function handleSourceAdd(file) {
            const match = /^([A-Za-z][A-Za-z0-9_]*)\.js$/i.exec(file.name);

            if (!match) {
                sourceMessage = text.invalidSourceFile;
                render();
                return;
            }

            if (findSource(match[1])) {
                sourceMessage = text.duplicateSource;
                render();
                return;
            }

            const source = {
                name: match[1],
                path: "",
                file: file,
                imported: true,
                data: null,
                status: "loading",
                enabled: true
            };
            sources.push(source);
            render();

            requestSource(source)
                .then(function () {
                    sourceMessage = persistImportedSources()
                        ? text.sourceAdded
                        : text.sourceStorageError;
                    render();
                })
                .catch(function () {
                    const index = sources.indexOf(source);
                    if (index !== -1) {
                        sources.splice(index, 1);
                    }
                    sourceMessage = text.invalidSourceFile;
                    render();
                });
        }

        function requestSource(source) {
            source.status = "loading";
            render();

            let request;
            if (source.file) {
                request = window.JsSource.loadFile(source.file);
            } else if (source.path) {
                request = window.JsSource.load(source.name, source.path);
            } else {
                // После F5 импортированный источник читается из сохранённой
                // копии, поскольку браузер больше не имеет доступа к File.
                request = Promise.resolve(source.data);
            }

            return request.then(function (data) {
                source.data = data;
                source.status = "ready";
                dashboard.dataset.state = "ready";
                render();
                return data;
            }).catch(function (error) {
                console.error(error);
                source.status = "error";
                dashboard.dataset.state = "error";
                render();
                throw error;
            });
        }

        function refreshAllSources() {
            sources.forEach(function (source) {
                requestSource(source).catch(function () {
                    // Ошибка уже отражена в техническом статусе источника.
                });
            });
        }

        refreshAllSources();
    }

    initializeDashboard();
}());
