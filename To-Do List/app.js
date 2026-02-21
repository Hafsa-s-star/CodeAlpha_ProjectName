// ---------------- LOCAL STORAGE FUNCTIONS ----------------
function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

var input = document.getElementById("Add");
var addBtn = document.getElementById("Add-Task");
var content = document.getElementById("Add-Content");

var editTask = null;

addBtn.onclick = function emptyAdd() {
    var task = input.value;

    if (task == "") {
        Swal.fire({
            icon: "warning",
            title: "Empty Field!",
            text: "Please enter a task before adding.",
            confirmButtonColor: "#3CA33C"
        });
        return;
    }


    if (editTask != null) {
        editTask.querySelector("p").innerText = task;
        var tasks = getTasks();
        var index = Array.from(content.children).indexOf(editTask);
        tasks[index].text = task;
        saveTasks(tasks);
        input.value = "";
        addBtn.innerText = "Add";
        editTask = null;
        return;
    }

    // Create task box
    var taskDiv = document.createElement("div");
    taskDiv.className = "task-box";
    taskDiv.style.display = "flex";
    taskDiv.style.alignItems = "center";
    taskDiv.style.justifyContent = "space-between";
    taskDiv.style.background = "white";
    taskDiv.style.marginTop = "10px";
    taskDiv.style.padding = "8px 10px";
    taskDiv.style.borderRadius = "4px";
    taskDiv.style.boxShadow = "0 0 5px rgba(0,0,0,0.1)";

    // Task text
    var p = document.createElement("p");
    p.innerText = task;
    p.style.margin = "0";
    p.style.flex = "1";
    p.style.textAlign = "left";
    p.style.color = "#333";

    // Done icon
    var doneIcon = document.createElement("i");
    doneIcon.className = "bi bi-check-circle";
    doneIcon.style.color = "green";
    doneIcon.style.marginRight = "10px";
    doneIcon.style.cursor = "pointer";
    doneIcon.onclick = function () {
        var tasks = getTasks();
        var index = Array.from(content.children).indexOf(taskDiv);

        if (p.style.textDecoration == "line-through") {
            p.style.textDecoration = "none";
            doneIcon.style.color = "green";
            tasks[index].done = false;
        } else {
            p.style.textDecoration = "line-through";
            doneIcon.style.color = "gray";
            tasks[index].done = true;
        }

        saveTasks(tasks);
    };

    // Edit icon
    var editIcon = document.createElement("i");
    editIcon.className = "bi bi-pencil-square";
    editIcon.style.color = "blue";
    editIcon.style.marginRight = "10px";
    editIcon.style.cursor = "pointer";
    editIcon.onclick = function () {
        input.value = p.innerText; // show old text in input
        addBtn.innerText = "Update"; // change button text
        editTask = taskDiv; // store current task
    };

    // Delete icon
    var deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash3";
    deleteIcon.style.color = "red";
    deleteIcon.style.cursor = "pointer";
    deleteIcon.onclick = function () {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this task?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                content.removeChild(taskDiv);
                var tasks = getTasks();
                var index = Array.from(content.children).indexOf(taskDiv);
                tasks.splice(index, 1);
                saveTasks(tasks);
                Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "Your task has been removed.",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };


    // Add all to div
    taskDiv.appendChild(p);
    taskDiv.appendChild(doneIcon);
    taskDiv.appendChild(editIcon);
    taskDiv.appendChild(deleteIcon);

    // Add div to content
    content.appendChild(taskDiv);
    // Save task to local storage
    var tasks = getTasks();
    tasks.push({ text: task, done: false });
    saveTasks(tasks);

    // Clear input
    input.value = "";
};

// ---------------- LOAD SAVED TASKS ----------------
window.onload = function () {
    var tasks = getTasks();

    tasks.forEach(taskObj => {
        input.value = taskObj.text;
        addBtn.onclick(); // reuse your same function

        var lastTask = content.lastElementChild;
        var p = lastTask.querySelector("p");
        var doneIcon = lastTask.querySelector(".bi-check-circle");

        if (taskObj.done) {
            p.style.textDecoration = "line-through";
            doneIcon.style.color = "gray";
        }
    });

    input.value = "";
};