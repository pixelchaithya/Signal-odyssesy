/* =========================================================
   SIGNAL ODYSSEY
   TERRAIN EVALUATION SYSTEM
   COMPLETE JAVASCRIPT
========================================================= */


/* =========================================================
   1. TEAM NAMES
   EDIT TEAM NAMES HERE ONLY
========================================================= */

const teams = [
    "Crew 404",
    "Edithcooked",
    "Signalx",
    "Sunflower",
    "Logic Legends",
    "Cyber Monkey",
    "Binary brains",
    "Proto",
    "TEAM",
    "Freshers 404",
    "Zen'in",
    "HackED",
    "Tech Drangons",
    "Sentinels",
    "ODYSSEUS RETURNS",
    "ERROR404",
    "Void",
    "Debuggers",
    "Discrete Minds",
    "Tech beginners",
    "Cypher",
    "Power Rangers",
    "RAVEN",
    "Scylla",
    "TEAM CROW",
    "TECHNO"
];


/* =========================================================
   2. TERRAIN DATA
========================================================= */

const terrainData = {

    Smooth: {
        icon: "〰️",
        unit: "m"
    },

    Rocky: {
        icon: "🪨",
        unit: "m"
    },

    Bumpy: {
        icon: "〰️",
        unit: "m"
    }

};


/* =========================================================
   3. PATH CONFIGURATION
========================================================= */

const paths = {

    "Path 01": [
        "Smooth",
        "Rocky",
        "Bumpy"
    ],

    "Path 02": [
        "Rocky",
        "Bumpy",
        "Smooth"
    ],

    "Path 03": [
        "Bumpy",
        "Smooth",
        "Rocky"
    ]

};


/* =========================================================
   4. IDEAL MEASUREMENTS
=========================================================

   IMPORTANT:

   These are PATH-SPECIFIC.

   Every path has its own ideal measurement for each
   terrain.

   These values below are DEMO VALUES.

   When your actual event measurements are finalized,
   edit ONLY the numbers in this object.

========================================================= */

const pathMeasurements = {

    "Path 01": {
        Smooth: 2.00,
        Rocky: 2.40,
        Bumpy: 1.80
    },

    "Path 02": {
        Rocky: 2.20,
        Bumpy: 2.60,
        Smooth: 1.70
    },

    "Path 03": {
        Bumpy: 2.30,
        Smooth: 1.90,
        Rocky: 2.50
    }

};


/* =========================================================
   5. STORAGE
========================================================= */

const STORAGE_KEY = "signalOdysseyResults";

const STORAGE_VERSION = "signalOdyssey_v3";


/* =========================================================
   6. APPLICATION STATE
========================================================= */

let results = [];

let editingTeam = null;


/* =========================================================
   7. GET IDEAL MEASUREMENT
========================================================= */

function getIdealMeasurement(path, terrain) {

    return pathMeasurements[path]?.[terrain] ?? 0;

}


/* =========================================================
   8. SCORING
========================================================= */

function calculateError(actual, ideal) {

    if (!Number.isFinite(actual) || ideal <= 0) {
        return 0;
    }

    return (
        Math.abs(actual - ideal) /
        ideal
    ) * 100;

}


function calculateAccuracy(actual, ideal) {

    if (!Number.isFinite(actual) || ideal <= 0) {
        return 0;
    }

    const errorRatio =
        Math.abs(actual - ideal) /
        ideal;

    return Math.max(
        0,
        100 * (1 - errorRatio)
    );

}


function calculateFinalAccuracy(measurements) {

    if (!measurements || measurements.length === 0) {
        return 0;
    }

    const total = measurements.reduce(
        (sum, measurement) => {
            return sum + Number(measurement.accuracy || 0);
        },
        0
    );

    return total / measurements.length;

}


/* =========================================================
   9. LOCAL STORAGE
========================================================= */

function saveResults() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            version: STORAGE_VERSION,
            results: results
        })
    );

}


function loadResults() {

    try {

        const raw =
            localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            results = [];
            return;
        }

        const parsed = JSON.parse(raw);

        /*
            If this is old broken data, reset it.
            This prevents Path 04 / Sand / old timing
            data from appearing in the new interface.
        */

        if (
            !parsed ||
            parsed.version !== STORAGE_VERSION ||
            !Array.isArray(parsed.results)
        ) {

            results = [];

            saveResults();

            return;
        }

        results = parsed.results
            .map(migrateResult)
            .filter(Boolean);

        saveResults();

    } catch (error) {

        console.error(
            "Could not load saved results:",
            error
        );

        results = [];

        saveResults();
    }

}


/* =========================================================
   10. RESULT MIGRATION / VALIDATION
========================================================= */

function migrateResult(result) {

    if (!result) {
        return null;
    }

    if (!teams.includes(result.team)) {
        return null;
    }

    if (!paths[result.path]) {
        return null;
    }

    const pathTerrains = paths[result.path];

    if (
        !Array.isArray(result.measurements) ||
        result.measurements.length !== 3
    ) {
        return null;
    }

    const measurements = [];

    for (const terrain of pathTerrains) {

        const oldMeasurement =
            result.measurements.find(
                item => item.terrain === terrain
            );

        if (!oldMeasurement) {
            return null;
        }

        const actual = Number(
            oldMeasurement.actual ??
            oldMeasurement.distance
        );

        if (!Number.isFinite(actual)) {
            return null;
        }

        const ideal =
            getIdealMeasurement(
                result.path,
                terrain
            );

        const error =
            calculateError(actual, ideal);

        const accuracy =
            calculateAccuracy(actual, ideal);

        measurements.push({

            terrain: terrain,

            ideal: ideal,

            actual: actual,

            error: error,

            accuracy: accuracy

        });

    }

    const finalAccuracy =
        calculateFinalAccuracy(measurements);

    return {

        team: result.team,

        path: result.path,

        measurements: measurements,

        finalAccuracy: finalAccuracy,

        finalScore: finalAccuracy,

        timestamp:
            result.timestamp ||
            new Date().toISOString()

    };

}


/* =========================================================
   11. RESULT HELPERS
========================================================= */

function getResultForTeam(team) {

    return results.find(
        result => result.team === team
    );

}


function getMeasurementForTerrain(result, terrain) {

    if (!result) {
        return null;
    }

    return result.measurements.find(
        measurement =>
            measurement.terrain === terrain
    );

}


/* =========================================================
   12. DATE
========================================================= */

function formatDateTime(dateValue) {

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "medium"
        }
    );

}


/* =========================================================
   13. NAVIGATION
========================================================= */

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(sectionId);

    if (!target) {
        return;
    }

    target.classList.add("active");


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });


    const titles = {

        dashboard: "Evaluation Dashboard",

        teams: "Participating Teams",

        terrain: "Terrain Configuration",

        results: "Enter Evaluation Results",

        analysis: "Performance Analysis",

        leaderboard: "Leaderboard"

    };


    document.getElementById("pageTitle").textContent =
        titles[sectionId] ||
        "Signal Odyssey";


    updateEverything();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   14. POPULATE SELECTS
========================================================= */

function populateSelects() {

    const teamSelect =
        document.getElementById("teamSelect");

    const pathSelect =
        document.getElementById("pathSelect");


    teamSelect.innerHTML = `
        <option value="">
            Select a team
        </option>
    `;


    teams.forEach(team => {

        const option =
            document.createElement("option");

        option.value = team;

        option.textContent = team;

        teamSelect.appendChild(option);

    });


    pathSelect.innerHTML = `
        <option value="">
            Select a path
        </option>
    `;


    Object.keys(paths).forEach(path => {

        const option =
            document.createElement("option");

        option.value = path;

        option.textContent = path;

        pathSelect.appendChild(option);

    });

}


/* =========================================================
   15. TEAM SELECT
========================================================= */

function handleTeamChange() {

    const team =
        document.getElementById("teamSelect").value;

    const existingResult =
        getResultForTeam(team);


    editingTeam =
        existingResult ? team : null;


    const pathSelect =
        document.getElementById("pathSelect");


    pathSelect.value =
        existingResult
            ? existingResult.path
            : "";


    if (existingResult) {

        showEditingNotice(team);

    } else {

        hideEditingNotice();

    }


    loadTerrainInputs();

}


/* =========================================================
   16. PATH SELECT
========================================================= */

function handlePathChange() {

    loadTerrainInputs();

}


/* =========================================================
   17. LOAD SAVED PATH
========================================================= */

function loadSelectedPath() {

    const team =
        document.getElementById("teamSelect").value;

    const pathSelect =
        document.getElementById("pathSelect");


    if (!team) {

        pathSelect.value = "";

        hideEditingNotice();

        loadTerrainInputs();

        return;
    }


    const existingResult =
        getResultForTeam(team);


    if (existingResult) {

        pathSelect.value =
            existingResult.path;

        editingTeam = team;

        showEditingNotice(team);

    } else {

        pathSelect.value = "";

        editingTeam = null;

        hideEditingNotice();

    }


    loadTerrainInputs();

}


/* =========================================================
   18. LOAD TERRAIN INPUTS
========================================================= */

function loadTerrainInputs() {

    const container =
        document.getElementById("terrainInputs");

    const team =
        document.getElementById("teamSelect").value;

    const path =
        document.getElementById("pathSelect").value;


    if (!team || !path || !paths[path]) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⌁
                </div>

                <h3>
                    Select a team and path
                </h3>

                <p>
                    Terrain measurement fields will appear here.
                </p>

            </div>

        `;

        return;
    }


    const existingResult =
        getResultForTeam(team);


    container.innerHTML = "";


    paths[path].forEach(
        (terrain, index) => {

            const data =
                terrainData[terrain];

            const ideal =
                getIdealMeasurement(
                    path,
                    terrain
                );


            const existingMeasurement =
                existingResult &&
                existingResult.path === path
                    ? getMeasurementForTerrain(
                        existingResult,
                        terrain
                    )
                    : null;


            const actualValue =
                existingMeasurement
                    ? existingMeasurement.actual
                    : "";


            const card =
                document.createElement("div");

            card.className =
                "measurement-card";


            card.innerHTML = `

                <div class="measurement-title">

                    <div class="measurement-icon">
                        ${data.icon}
                    </div>

                    <div class="measurement-heading">

                        <h4>
                            ${terrain}
                        </h4>

                        <small>
                            Terrain ${index + 1}
                        </small>

                    </div>

                </div>


                <div class="reference-box">

                    <span>
                        PATH-SPECIFIC IDEAL
                    </span>

                    <strong>
                        ${ideal.toFixed(2)}
                        ${data.unit}
                    </strong>

                </div>


                <label class="field-label">
                    Actual Measurement
                </label>


                <div class="input-with-unit">

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="actual-${index}"
                        data-index="${index}"
                        value="${actualValue}"
                        placeholder="Enter value"
                        oninput="updateLiveMeasurement(${index})"
                    >

                    <span class="input-unit">
                        ${data.unit}
                    </span>

                </div>


                <div class="calculation-grid">

                    <div class="calculation-box">

                        <span>
                            Error
                        </span>

                        <strong
                            id="error-${index}"
                            class="calculation-value"
                        >
                            —
                        </strong>

                    </div>


                    <div class="calculation-box">

                        <span>
                            Accuracy
                        </span>

                        <strong
                            id="accuracy-${index}"
                            class="calculation-value"
                        >
                            —
                        </strong>

                    </div>

                </div>


                <span
                    id="status-${index}"
                    class="terrain-status pending-status"
                >
                    Waiting
                </span>

            `;


            container.appendChild(card);


            if (existingMeasurement) {

                updateLiveMeasurement(index);

            }

        }
    );

}


/* =========================================================
   19. LIVE CALCULATION
========================================================= */

function updateLiveMeasurement(index) {

    const path =
        document.getElementById("pathSelect").value;

    if (!path || !paths[path]) {
        return;
    }


    const terrain =
        paths[path][index];

    const input =
        document.getElementById(
            `actual-${index}`
        );

    const errorElement =
        document.getElementById(
            `error-${index}`
        );

    const accuracyElement =
        document.getElementById(
            `accuracy-${index}`
        );

    const statusElement =
        document.getElementById(
            `status-${index}`
        );


    if (
        !input ||
        !errorElement ||
        !accuracyElement ||
        !statusElement
    ) {
        return;
    }


    const actual =
        Number(input.value);

    const ideal =
        getIdealMeasurement(
            path,
            terrain
        );


    if (
        input.value === "" ||
        !Number.isFinite(actual)
    ) {

        errorElement.textContent = "—";

        accuracyElement.textContent = "—";

        accuracyElement.className =
            "calculation-value";

        statusElement.textContent =
            "Waiting";

        statusElement.className =
            "terrain-status pending-status";

        return;
    }


    const error =
        calculateError(
            actual,
            ideal
        );


    const accuracy =
        calculateAccuracy(
            actual,
            ideal
        );


    errorElement.textContent =
        `${error.toFixed(2)}%`;


    accuracyElement.textContent =
        `${accuracy.toFixed(2)}%`;


    accuracyElement.className =
        "calculation-value " +
        getAccuracyClass(accuracy);


    statusElement.className =
        `terrain-status ${getStatusClass(accuracy)}`;


    statusElement.textContent =
        getAccuracyLabel(accuracy);

}


/* =========================================================
   20. ACCURACY HELPERS
========================================================= */

function getAccuracyClass(accuracy) {

    if (accuracy >= 90) {
        return "accuracy-high";
    }

    if (accuracy >= 75) {
        return "accuracy-medium";
    }

    return "accuracy-low";

}


function getStatusClass(accuracy) {

    if (accuracy >= 90) {
        return "accuracy-high";
    }

    if (accuracy >= 75) {
        return "accuracy-medium";
    }

    return "accuracy-low";

}


function getAccuracyLabel(accuracy) {

    if (accuracy >= 90) {
        return "Excellent";
    }

    if (accuracy >= 75) {
        return "Good";
    }

    return "Needs Improvement";

}


/* =========================================================
   21. SUBMIT RESULT
========================================================= */

function submitResult() {

    const team =
        document.getElementById("teamSelect").value;

    const path =
        document.getElementById("pathSelect").value;


    if (!team) {

        alert(
            "Please select a team."
        );

        return;
    }


    if (!path || !paths[path]) {

        alert(
            "Please select a terrain path."
        );

        return;
    }


    const measurements = [];


    for (
        let index = 0;
        index < paths[path].length;
        index++
    ) {

        const terrain =
            paths[path][index];

        const input =
            document.getElementById(
                `actual-${index}`
            );

        const actual =
            Number(input?.value);


        if (
            input?.value === "" ||
            !Number.isFinite(actual) ||
            actual < 0
        ) {

            alert(
                `Please enter a valid measurement for ${terrain}.`
            );

            input?.focus();

            return;
        }


        const ideal =
            getIdealMeasurement(
                path,
                terrain
            );


        const error =
            calculateError(
                actual,
                ideal
            );


        const accuracy =
            calculateAccuracy(
                actual,
                ideal
            );


        measurements.push({

            terrain: terrain,

            ideal: ideal,

            actual: actual,

            error: error,

            accuracy: accuracy

        });

    }


    const finalAccuracy =
        calculateFinalAccuracy(
            measurements
        );


    const existingResult =
        getResultForTeam(team);


    if (existingResult) {

        const shouldReplace =
            confirm(
                `${team} already has a result.\n\n` +
                `Do you want to replace the existing evaluation?`
            );


        if (!shouldReplace) {
            return;
        }

    }


    const result = {

        team: team,

        path: path,

        measurements: measurements,

        finalAccuracy: finalAccuracy,

        finalScore: finalAccuracy,

        timestamp:
            new Date().toISOString()

    };


    const existingIndex =
        results.findIndex(
            item => item.team === team
        );


    if (existingIndex >= 0) {

        results[existingIndex] =
            result;

    } else {

        results.push(result);

    }


    saveResults();


    editingTeam = null;

    hideEditingNotice();


    showResultModal(result);


    updateEverything();

}


/* =========================================================
   22. EDIT RESULT
========================================================= */

function editResult(team) {

    const result =
        getResultForTeam(team);


    if (!result) {
        return;
    }


    editingTeam = team;


    showSection("results");


    const teamSelect =
        document.getElementById("teamSelect");

    const pathSelect =
        document.getElementById("pathSelect");


    teamSelect.value =
        result.team;

    pathSelect.value =
        result.path;


    showEditingNotice(team);

    loadTerrainInputs();


    setTimeout(() => {

        document
            .getElementById("teamSelect")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }, 100);

}


/* =========================================================
   23. EDITING NOTICE
========================================================= */

function showEditingNotice(team) {

    const notice =
        document.getElementById(
            "editingNotice"
        );

    const text =
        document.getElementById(
            "editingText"
        );


    if (!notice) {
        return;
    }


    text.textContent =
        `Editing saved result for ${team}. Submit to update it.`;


    notice.classList.add("show");

}


function hideEditingNotice() {

    const notice =
        document.getElementById(
            "editingNotice"
        );


    if (notice) {
        notice.classList.remove("show");
    }

}


/* =========================================================
   24. CLEAR FORM
========================================================= */

function clearForm() {

    const teamSelect =
        document.getElementById("teamSelect");

    const pathSelect =
        document.getElementById("pathSelect");


    teamSelect.value = "";

    pathSelect.value = "";


    editingTeam = null;


    hideEditingNotice();


    document.getElementById(
        "terrainInputs"
    ).innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ⌁
            </div>

            <h3>
                Select a team and path
            </h3>

            <p>
                Terrain measurement fields will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   25. RESULT MODAL
========================================================= */

function showResultModal(result) {

    const modal =
        document.getElementById(
            "resultModal"
        );

    const message =
        document.getElementById(
            "modalMessage"
        );

    const summary =
        document.getElementById(
            "resultSummary"
        );

    const score =
        document.getElementById(
            "modalScore"
        );

    const finalScore =
        document.getElementById(
            "modalFinalScore"
        );


    message.textContent =
        `${result.team} — Evaluation Saved`;


    summary.innerHTML = `

        ${result.measurements.map(
            measurement => `

                <div class="result-terrain">

                    <div class="result-terrain-title">

                        ${terrainData[
                            measurement.terrain
                        ].icon}

                        ${measurement.terrain}

                    </div>

                    <div class="result-values">

                        Ideal:
                        <strong>
                            ${measurement.ideal.toFixed(2)} m
                        </strong>

                        &nbsp; | &nbsp;

                        Actual:
                        <strong>
                            ${measurement.actual.toFixed(2)} m
                        </strong>

                        &nbsp; | &nbsp;

                        Accuracy:
                        <strong>
                            ${measurement.accuracy.toFixed(2)}%
                        </strong>

                    </div>

                </div>

            `
        ).join("")}

    `;


    score.textContent =
        `${result.finalAccuracy.toFixed(2)}%`;


    finalScore.textContent =
        `${result.finalScore.toFixed(2)} / 100`;


    modal.classList.add("show");

}


function closeModal() {

    document
        .getElementById("resultModal")
        .classList.remove("show");

}


/* =========================================================
   26. RENDER TEAMS
========================================================= */

function renderTeams() {

    const container =
        document.getElementById(
            "teamGrid"
        );


    container.innerHTML = "";


    teams.forEach(
        (team, index) => {

            const result =
                getResultForTeam(team);


            const card =
                document.createElement("div");

            card.className =
                "team-card";


            const initials =
                getInitials(team);


            if (result) {

                card.innerHTML = `

                    <div class="team-card-top">

                        <div class="team-avatar">
                            ${initials}
                        </div>

                        <div class="team-name"
                             title="${team}">
                            ${team}
                        </div>

                        <span class="status-chip completed-chip">
                            COMPLETED
                        </span>

                    </div>


                    <div class="team-card-bottom">

                        <div>

                            <div class="team-path">
                                ${result.path}
                            </div>

                        </div>

                        <div class="team-score">
                            ${result.finalAccuracy.toFixed(2)}%
                        </div>

                    </div>


                    <button
                        class="edit-result-btn"
                        onclick="editResult('${escapeAttribute(team)}')"
                    >
                        Edit Result
                    </button>

                `;

            } else {

                card.innerHTML = `

                    <div class="team-card-top">

                        <div class="team-avatar">
                            ${initials}
                        </div>

                        <div class="team-name"
                             title="${team}">
                            ${team}
                        </div>

                        <span class="status-chip pending-chip">
                            PENDING
                        </span>

                    </div>


                    <div class="team-card-bottom">

                        <div>

                            <div class="team-path">
                                Evaluation not submitted
                            </div>

                        </div>

                        <div class="team-score muted-score">
                            —
                        </div>

                    </div>

                `;

            }


            container.appendChild(card);

        }
    );


    document.getElementById(
        "teamCountDisplay"
    ).textContent =
        teams.length;

}


/* =========================================================
   27. INITIALS
========================================================= */

function getInitials(name) {

    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();

}


/* =========================================================
   28. ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


/* =========================================================
   29. TERRAIN SETUP
========================================================= */

function renderTerrainCards() {

    const container =
        document.getElementById(
            "terrainCards"
        );


    container.innerHTML = "";


    Object.entries(paths).forEach(
        ([path, terrains], pathIndex) => {

            const card =
                document.createElement("div");

            card.className =
                "terrain-path-card";


            card.innerHTML = `

                <div class="terrain-path-header">

                    <div class="path-number">
                        ROUTE 0${pathIndex + 1}
                    </div>

                    <h3>
                        ${path}
                    </h3>

                    <p>
                        Path-specific ideal measurements
                    </p>

                </div>


                <div class="ideal-list">

                    ${terrains.map(
                        (terrain, index) => {

                            const data =
                                terrainData[terrain];

                            const ideal =
                                getIdealMeasurement(
                                    path,
                                    terrain
                                );


                            return `

                                <div class="ideal-row">

                                    <div class="ideal-terrain">

                                        <div class="terrain-icon">
                                            ${data.icon}
                                        </div>

                                        <div>

                                            <strong>
                                                ${terrain}
                                            </strong>

                                            <span>
                                                Terrain ${index + 1}
                                            </span>

                                        </div>

                                    </div>

                                    <div class="ideal-value">

                                        ${ideal.toFixed(2)}

                                        <span>
                                            ${data.unit}
                                        </span>

                                    </div>

                                </div>

                            `;

                        }
                    ).join("")}

                </div>

            `;


            container.appendChild(card);

        }
    );

}


/* =========================================================
   30. PATH PREVIEW
========================================================= */

function renderPathPreview() {

    const container =
        document.getElementById(
            "pathPreview"
        );


    container.innerHTML = "";


    Object.entries(paths).forEach(
        ([path, terrains]) => {

            const row =
                document.createElement("div");

            row.className =
                "path-mini";


            row.innerHTML = `

                <div class="path-mini-title">
                    ${path}
                </div>

                <div class="path-mini-items">

                    ${terrains.map(
                        (terrain, index) => {

                            const ideal =
                                getIdealMeasurement(
                                    path,
                                    terrain
                                );


                            return `

                                ${
                                    index > 0
                                        ? `<span class="arrow">→</span>`
                                        : ""
                                }

                                <span class="terrain-pill">

                                    ${terrainData[
                                        terrain
                                    ].icon}

                                    ${terrain}

                                    <strong>
                                        ${ideal.toFixed(2)}m
                                    </strong>

                                </span>

                            `;

                        }
                    ).join("")}

                </div>

            `;


            container.appendChild(row);

        }
    );

}


/* =========================================================
   31. DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const completed =
        results.length;

    const pending =
        teams.length - completed;


    const average =
        completed > 0
            ? results.reduce(
                (sum, result) =>
                    sum + result.finalAccuracy,
                0
            ) / completed
            : 0;


    document.getElementById(
        "totalTeams"
    ).textContent =
        teams.length;


    document.getElementById(
        "completedTeams"
    ).textContent =
        completed;


    document.getElementById(
        "pendingTeams"
    ).textContent =
        pending;


    document.getElementById(
        "averageAccuracy"
    ).textContent =
        `${average.toFixed(2)}%`;

}


/* =========================================================
   32. TOP THREE
========================================================= */

function renderTopThree() {

    const container =
        document.getElementById(
            "topThree"
        );


    const sorted =
        [...results]
            .sort(
                (a, b) =>
                    b.finalAccuracy -
                    a.finalAccuracy
            )
            .slice(0, 3);


    if (sorted.length === 0) {

        container.innerHTML = `

            <div class="empty-top">

                <div style="font-size:22px;margin-bottom:8px;">
                    ◇
                </div>

                No completed evaluations yet.

                <br>

                Results will appear here once teams are evaluated.

            </div>

        `;

        return;
    }


    container.innerHTML =
        sorted.map(
            (result, index) => `

                <div class="rank-card">

                    <div class="rank-number">
                        #${index + 1}
                    </div>

                    <h4 title="${result.team}">
                        ${result.team}
                    </h4>

                    <div class="rank-path">
                        ${result.path}
                    </div>

                    <span class="rank-score">

                        ${result.finalAccuracy.toFixed(2)}%

                        <span>
                            accuracy
                        </span>

                    </span>

                </div>

            `
        ).join("");

}


/* =========================================================
   33. LEADERBOARD
========================================================= */

function renderLeaderboard() {

    const body =
        document.getElementById(
            "leaderboardBody"
        );


    const sorted =
        [...teams]
            .map(team => ({
                team: team,
                result: getResultForTeam(team)
            }))
            .sort((a, b) => {

                if (!a.result && !b.result) {
                    return 0;
                }

                if (!a.result) {
                    return 1;
                }

                if (!b.result) {
                    return -1;
                }

                return (
                    b.result.finalAccuracy -
                    a.result.finalAccuracy
                );

            });


    body.innerHTML = "";


    sorted.forEach(
        (item, index) => {

            const result =
                item.result;


            const row =
                document.createElement("tr");


            if (!result) {
                row.classList.add("pending-row");
            }


            const rankClass =
                index === 0
                    ? "gold-rank"
                    : index === 1
                        ? "silver-rank"
                        : index === 2
                            ? "bronze-rank"
                            : "";


            if (result) {

                const smooth =
                    getMeasurementForTerrain(
                        result,
                        "Smooth"
                    );

                const rocky =
                    getMeasurementForTerrain(
                        result,
                        "Rocky"
                    );

                const bumpy =
                    getMeasurementForTerrain(
                        result,
                        "Bumpy"
                    );


                row.innerHTML = `

                    <td>

                        <div class="rank-badge ${rankClass}">
                            ${index + 1}
                        </div>

                    </td>


                    <td class="team-cell">
                        ${item.team}
                    </td>


                    <td class="path-cell">
                        ${result.path}
                    </td>


                    <td>
                        ${formatMeasurementAccuracy(smooth)}
                    </td>


                    <td>
                        ${formatMeasurementAccuracy(rocky)}
                    </td>


                    <td>
                        ${formatMeasurementAccuracy(bumpy)}
                    </td>


                    <td class="score-cell">

                        <span class="accuracy-bar">
                            <span
                                class="accuracy-bar-fill"
                                style="width:${Math.min(
                                    100,
                                    result.finalAccuracy
                                )}%"
                            ></span>
                        </span>

                        ${result.finalAccuracy.toFixed(2)}%

                    </td>


                    <td>

                        <span class="status-chip completed-chip">
                            COMPLETED
                        </span>

                    </td>


                    <td>

                        <button
                            class="table-edit-btn"
                            onclick="editResult('${escapeAttribute(item.team)}')"
                        >
                            Edit
                        </button>

                    </td>

                `;

            } else {

                row.innerHTML = `

                    <td>

                        <div class="rank-badge">
                            —
                        </div>

                    </td>


                    <td class="team-cell">
                        ${item.team}
                    </td>


                    <td class="path-cell">
                        —
                    </td>


                    <td>—</td>
                    <td>—</td>
                    <td>—</td>


                    <td class="score-cell">
                        —
                    </td>


                    <td>

                        <span class="status-chip pending-chip">
                            PENDING
                        </span>

                    </td>


                    <td>

                        <span class="table-pending">
                            —
                        </span>

                    </td>

                `;

            }


            body.appendChild(row);

        }
    );

}


/* =========================================================
   34. MEASUREMENT DISPLAY
========================================================= */

function formatMeasurementAccuracy(measurement) {

    if (!measurement) {
        return "—";
    }


    return `
        <span class="${getAccuracyClass(
            measurement.accuracy
        )}">
            ${measurement.accuracy.toFixed(2)}%
        </span>
    `;

}


/* =========================================================
   35. ANALYSIS
========================================================= */

function renderAnalysis() {

    const container =
        document.getElementById(
            "analysisContent"
        );


    if (results.length === 0) {

        container.innerHTML = `

            <div class="panel">

                <div class="empty-state">

                    <div class="empty-icon">
                        ◫
                    </div>

                    <h3>
                        No evaluation data yet
                    </h3>

                    <p>
                        Complete at least one team evaluation
                        to see performance analysis.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    const average =
        results.reduce(
            (sum, result) =>
                sum + result.finalAccuracy,
            0
        ) / results.length;


    const highest =
        Math.max(
            ...results.map(
                result =>
                    result.finalAccuracy
            )
        );


    const lowest =
        Math.min(
            ...results.map(
                result =>
                    result.finalAccuracy
            )
        );


    const leader =
        [...results].sort(
            (a, b) =>
                b.finalAccuracy -
                a.finalAccuracy
        )[0];


    const terrainAverages = {};


    ["Smooth", "Rocky", "Bumpy"]
        .forEach(terrain => {

            const values =
                results
                    .map(
                        result =>
                            getMeasurementForTerrain(
                                result,
                                terrain
                            )
                    )
                    .filter(Boolean)
                    .map(
                        measurement =>
                            measurement.accuracy
                    );


            terrainAverages[terrain] =
                values.length
                    ? values.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ) / values.length
                    : 0;

        });


    container.innerHTML = `

        <div class="analysis-stat-grid">

            <div class="analysis-stat">

                <span>
                    AVERAGE ACCURACY
                </span>

                <strong>
                    ${average.toFixed(2)}%
                </strong>

            </div>


            <div class="analysis-stat">

                <span>
                    HIGHEST SCORE
                </span>

                <strong class="accuracy-high">
                    ${highest.toFixed(2)}%
                </strong>

            </div>


            <div class="analysis-stat">

                <span>
                    LOWEST SCORE
                </span>

                <strong class="accuracy-low">
                    ${lowest.toFixed(2)}%
                </strong>

            </div>

        </div>


        <div class="analysis-layout">

            <div class="panel">

                <div class="panel-header">

                    <div>

                        <span class="section-label">
                            TERRAIN PERFORMANCE
                        </span>

                        <h3>
                            Average Accuracy by Terrain
                        </h3>

                    </div>

                </div>


                <div class="analysis-bars">

                    ${renderAnalysisBar(
                        "Smooth",
                        terrainAverages.Smooth
                    )}

                    ${renderAnalysisBar(
                        "Rocky",
                        terrainAverages.Rocky
                    )}

                    ${renderAnalysisBar(
                        "Bumpy",
                        terrainAverages.Bumpy
                    )}

                </div>

            </div>


            <div class="leader-highlight">

                <div class="leader-avatar">
                    ${getInitials(leader.team)}
                </div>

                <span class="section-label">
                    CURRENT LEADER
                </span>

                <h3>
                    ${leader.team}
                </h3>

                <span class="leader-score">
                    ${leader.finalAccuracy.toFixed(2)}%
                </span>

                <p>
                    ${leader.path} · Average terrain accuracy
                </p>

            </div>

        </div>


        <div class="panel" style="margin-top:18px;">

            <div class="panel-header">

                <div>

                    <span class="section-label">
                        TERRAIN BREAKDOWN
                    </span>

                    <h3>
                        Measurement Performance
                    </h3>

                </div>

            </div>


            <div class="analysis-breakdown-grid">

                ${renderBreakdownCard(
                    "Smooth",
                    terrainAverages.Smooth
                )}

                ${renderBreakdownCard(
                    "Rocky",
                    terrainAverages.Rocky
                )}

                ${renderBreakdownCard(
                    "Bumpy",
                    terrainAverages.Bumpy
                )}

            </div>

        </div>

    `;

}


function renderAnalysisBar(
    terrain,
    accuracy
) {

    return `

        <div class="analysis-bar-row">

            <div class="analysis-bar-label">
                ${terrain}
            </div>

            <div class="analysis-bar-track">

                <div
                    class="analysis-bar-fill"
                    style="width:${Math.min(
                        100,
                        Math.max(0, accuracy)
                    )}%"
                ></div>

            </div>

            <div class="analysis-bar-value">
                ${accuracy.toFixed(2)}%
            </div>

        </div>

    `;

}


function renderBreakdownCard(
    terrain,
    accuracy
) {

    const icon =
        terrainData[terrain].icon;


    return `

        <div class="breakdown-card">

            <div class="breakdown-top">

                <strong>
                    ${icon} ${terrain}
                </strong>

                <strong class="${getAccuracyClass(
                    accuracy
                )}">
                    ${accuracy.toFixed(2)}%
                </strong>

            </div>


            <div class="breakdown-values">

                Average accuracy across
                completed evaluations.

            </div>

        </div>

    `;

}


/* =========================================================
   36. EXCEL EXPORT
========================================================= */

function exportToExcel() {

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Excel export library could not be loaded. Please check your internet connection and try again."
        );

        return;
    }


    const rows = [];


    teams.forEach(team => {

        const result =
            getResultForTeam(team);


        const smooth =
            result
                ? getMeasurementForTerrain(
                    result,
                    "Smooth"
                )
                : null;


        const rocky =
            result
                ? getMeasurementForTerrain(
                    result,
                    "Rocky"
                )
                : null;


        const bumpy =
            result
                ? getMeasurementForTerrain(
                    result,
                    "Bumpy"
                )
                : null;


        rows.push({

            "Team Name":
                team,

            "Terrain Path":
                result?.path || "",


            "Smooth - Ideal":
                smooth?.ideal ?? "",

            "Smooth - Actual":
                smooth?.actual ?? "",

            "Smooth - Error %":
                smooth
                    ? Number(
                        smooth.error.toFixed(2)
                    )
                    : "",

            "Smooth - Accuracy %":
                smooth
                    ? Number(
                        smooth.accuracy.toFixed(2)
                    )
                    : "",


            "Rocky - Ideal":
                rocky?.ideal ?? "",

            "Rocky - Actual":
                rocky?.actual ?? "",

            "Rocky - Error %":
                rocky
                    ? Number(
                        rocky.error.toFixed(2)
                    )
                    : "",

            "Rocky - Accuracy %":
                rocky
                    ? Number(
                        rocky.accuracy.toFixed(2)
                    )
                    : "",


            "Bumpy - Ideal":
                bumpy?.ideal ?? "",

            "Bumpy - Actual":
                bumpy?.actual ?? "",

            "Bumpy - Error %":
                bumpy
                    ? Number(
                        bumpy.error.toFixed(2)
                    )
                    : "",

            "Bumpy - Accuracy %":
                bumpy
                    ? Number(
                        bumpy.accuracy.toFixed(2)
                    )
                    : "",


            "Final Accuracy":
                result
                    ? Number(
                        result.finalAccuracy.toFixed(2)
                    )
                    : "",

            "Final Score":
                result
                    ? Number(
                        result.finalScore.toFixed(2)
                    )
                    : "",

            "Submission Date/Time":
                result
                    ? formatDateTime(
                        result.timestamp
                    )
                    : ""

        });

    });


    const worksheet =
        XLSX.utils.json_to_sheet(rows);


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Signal Odyssey Results"
    );


    XLSX.writeFile(
        workbook,
        "Signal_Odyssey_Terrain_Results.xlsx"
    );

}


/* =========================================================
   37. UPDATE EVERYTHING
========================================================= */

function updateEverything() {

    updateDashboardStats();

    renderTopThree();

    renderTeams();

    renderTerrainCards();

    renderPathPreview();

    renderLeaderboard();

    renderAnalysis();

}


/* =========================================================
   38. CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    const now =
        new Date();


    element.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   39. EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadResults();

        populateSelects();

        updateCurrentDate();

        updateEverything();


        /*
            Navigation
        */

        document
            .querySelectorAll(".nav-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        showSection(
                            button.dataset.section
                        );

                    }
                );

            });


        /*
            Team selection
        */

        document
            .getElementById("teamSelect")
            .addEventListener(
                "change",
                handleTeamChange
            );


        /*
            Path selection
        */

        document
            .getElementById("pathSelect")
            .addEventListener(
                "change",
                handlePathChange
            );


        /*
            Excel
        */

        document
            .getElementById("exportButton")
            .addEventListener(
                "click",
                exportToExcel
            );


        /*
            Modal background
        */

        document
            .querySelector(".modal-overlay")
            .addEventListener(
                "click",
                closeModal
            );


        /*
            Escape key
        */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    closeModal();

                }

            }
        );

    }
);