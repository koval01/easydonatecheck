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

const getSum = (callback) => {
    requestCall((r) => {
        callback(JSON.parse(r));
    }, "/api/sum", "GET");
}

const updateStatistics = () => {
    getSum(function (data) {
        const selector = document.getElementById("statistics_block");
        selector.innerHTML = `
            <p class="text-muted">
                За все время было создано
                <span class="text-primary">${data.len.all}</span>
                чеков, из них оплачено
                <span class="text-primary">${data.len.clear}</span>.
                Сумма всех покупок <span class="text-primary">${data.sum.all}</span>₽ 
                из которой чистый доход <span class="text-primary">${data.sum.clear}</span>₽
            </p>
        `;
    })
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
                <li id="id_${r.id}" payed="${r.status ? "True" : "False"}" class="list-group-item justify-content-between lh-sm">
                    <span class="col">Никнейм: <pre>${r.customer}</pre></span>
                    <span class="col">Почта: <pre>${r.email ? r.email : "Нет"}</pre></span>
                    <div class="row">
                        <span class="col">Номер чека: <pre>${r.id}</pre></span>
                        <span class="col">Cтатус: <pre>${r.status ? "Оплачен" : "Не оплачен"}</pre></span>
                        <span class="col">Сумма: <pre>${r.cost}</pre></span>
                        <span class="col">Доход: <pre>${r.enrolled}</pre></span>
                        <span class="col">Ошибка: <pre>${r.error ? "Да" : "Нет"}</pre></span>
                        
                        <span class="col">Создан: <pre>${r.created_at}</pre></span>
                        <span class="col">Обновлен: <pre>${r.updated_at}</pre></span>
                    </div>
                    <button type="button" class="btn btn-primary" style="position: absolute;right: 1em;z-index: 1;border-radius:.6em" opened="false" onclick="displayJsonRaw(${r.id})" id="showJsonButton_${r.id}">Показать JSON</button>
                    <div id="originalJson_${r.id}" style="height: 2.4em;opacity: 0;transition: all .6s;overflow: auto;box-shadow: rgb(0 0 0 / 60%) 0 0 1em;padding: 1em;border-radius: 0.6em;"></div>
                </li>
            `;
            results.innerHTML = results.innerHTML + resultTemplate;
            document.getElementById(`originalJson_${r.id}`).append(el);
        }
    }, input.value, selectField(input.value)["system"])
}

const displayJsonRaw = (id) => {
    const button = document.getElementById(`showJsonButton_${id}`);
    const field = document.getElementById(`originalJson_${id}`);

    if (button.getAttribute("opened") === "true") {
        button.setAttribute("opened", "false");
        button.innerText = "Показать JSON";
        field.style.height = "2.4em";
        field.style.opacity = "0";
    } else {
        button.setAttribute("opened", "true");
        button.innerText = "Скрыть JSON";
        field.style.height = "40vh";
        field.style.opacity = "1";
    }
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

    updateStatistics();
    setInterval(updateStatistics, 5000);
}