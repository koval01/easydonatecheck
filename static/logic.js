const input = document.getElementById("searchField");
const type = document.getElementById("searchFieldType");

const requestCall = (callback, url, method, json = false, json_body = null) => {
    let request = new XMLHttpRequest();
    let json_body_local = {};
    request.open(method, url, true);

    if (method.toUpperCase() === "POST") {
        request.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8"
        );
        json_body_local = JSON
            .stringify(json_body);
    }

    request.onload = function () {
        if (request.status >= 200 &&
            request.status < 400) {
            if (json) {
                callback(JSON.parse(
                    request
                        .responseText
                ));
            } else {
                callback(request
                    .responseText
                );
            }
        } else {
            console.error(
                `Error get response! Status code: ${request.status}`
            );
        }
    };

    request.onerror = function (error) {
        console.error(
            `Error make request! Error: ${error}`
        );
        callback(null)
    };

    request.onreadystatechange = () => {
        if (request.status >= 400) {
            if (json) {
                callback({
                    success: false
                });
            } else {
                callback(null);
            }
        }
    };

    request.send(json_body_local);
}

const getDataSearch = (callback, data, field) => {
    if (!data || !field) {
        callback(null);
        alert("Данные для выполнения запроса отсутствуют");
        return;
    }
    requestCall((r) => {
        callback(r);
    }, "/api/search", "POST", true, {
        data: data, field: field
    });
}

const selectField = (data) => {
    if (!data) {
        return {system: null, display: "нет"};
    }
    if (data.slice(0, 2) === "N+") {
        return {system: "customer", display: "никнейм", data: data.slice(2)}
    } else if (!isNaN(data)) {
        return {system: "id", display: "номер", data: data};
    } else if (data.includes("@")) {
        return {system: "email", display: "почта", data: data};
    }
    return {system: "customer", display: "никнейм", data: data};
}

const buttonSearchClick = () => {
    const button = document.getElementById("buttonSearch");
    const results = document.getElementById("resultsList");
    const counter = document.getElementById("resultsCount");

    if (button.getAttribute("disabled")) {
        return null;
    }
    if (!input.value) {
        return alert("Введи данные для поиска! Можно использовать: email, никнейм или номер чека");
    }

    button.setAttribute("disabled", "");
    input.setAttribute("disabled", "");

    type.innerText = "поиск...";
    counter.innerText = "0";
    results.innerHTML = "";

    getDataSearch(function (response) {
        button.removeAttribute("disabled");
        input.removeAttribute("disabled");
        updateType();

        if (!response || !response.length) {
            alert("Ничего не найдено");
        }

        counter.innerText = response.length;
        for (let r of response) {
            const el = document.createElement("pre");
            el.id = `code_${r.id}`;
            el.innerText = JSON.stringify(r, undefined, 4);
            const resultTemplate = `
                <li id="id_${r.id}" class="list-group-item d-flex justify-content-between lh-sm">
                </li>
            `;
            results.innerHTML = results.innerHTML + resultTemplate;
            document.getElementById(`id_${r.id}`).append(el);
        }
    }, input.value, selectField(input.value)["system"])
}

const updateType = () => {
    const field = selectField(input.value)["display"];
    type.innerText = String(field);
}

window.onload = () => {
    input.addEventListener(
    "input",
    (_) => {
        updateType();
    });
}