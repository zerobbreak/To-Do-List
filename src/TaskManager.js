import "./style.css";

class TaskManager {
  constructor() {
    // Elements
    const elements = {
      listsContainer: "[data-lists]",
      newListForm: "[data-new-list-form]",
      newListInput: "[data-new-list-input]",
      deleteListButton: "[data-delete-list-button]",
      listDisplayContainer: "[data-list-display-container]",
      taskTemplate: "#task-template",
      listTitle: "[data-list-title]",
      listCount: "[data-list-count]",
      tasksContainer: "[data-tasks]",
      clearButton: "[data-clear-complete-tasks-button]",
      showPopupButton: "#show-popup",
      closePopupButton: "#close-popup",
      popupForm: ".popup form",
    };

    for (const key in elements) {
      this[key] = document.querySelector(elements[key]);
    }

    // Add this variable at the beginning
    this.isFormVisible = false;
    this.editableElements = [];

    // Local Storage Keys
    this.LOCAL_STORAGE_LIST_KEY = "task.list";
    this.LOCAL_STORAGE_SELECTED_LIST_ID_KEY = "task.selectedListId";

    // Lists and selected list ID
    this.lists =
      JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_LIST_KEY)) || [];
    this.selectedListsId = localStorage.getItem(
      this.LOCAL_STORAGE_SELECTED_LIST_ID_KEY
    );

    // Initialize the application
    this.render();
    this.setupEventListeners();
  }

  checkDefaultTask() {
    const selectedList = this.getSelectedList();

    // Check if there's a default task in the selected list
    const defaultTask = selectedList.tasks.find(
      (task) => task.name === "My Task"
    );

    if (defaultTask) {
      // If the default task exists, set its `complete` property to `true`
      defaultTask.complete = true;

      // Render the tasks and task count
      this.renderTasks(selectedList);
      this.renderTaskCount(selectedList);

      // Save the updated task
      this.save();
    }
  }

  createDefaultList() {
    const defaultList = this.createList("My Project"); // Change the project name if needed

    // Create a default task
    const defaultTask = this.createTask(
      "My Task",
      "Default description",
      "2023-12-31", // Set a due date if needed
      "medium", // Set the priority (high, medium, low)
      "Default notes"
    );

    defaultList.tasks.push(defaultTask);
    this.lists.push(defaultList);

    // Save to localStorage
    this.save();

    // Render the lists and select the default list
    this.render();
    this.selectList(defaultList.id);

    // Check the default task
    this.checkDefaultTask();
  }

  setupEventListeners() {
    // Event listeners
    this.listsContainer.addEventListener("click", (e) =>
      this.handleListClick(e)
    );
    this.clearButton.addEventListener("click", (e) =>
      this.handleClearButtonClick(e)
    );
    this.deleteListButton.addEventListener("click", (e) =>
      this.handleDeleteListButtonClick(e)
    );
    this.tasksContainer.addEventListener("click", (e) => {
      this.handleTaskCheckboxClick(e);
      this.handleEditButtonClick(e);
    });
    this.newListForm.addEventListener("submit", (e) =>
      this.handleNewListFormSubmit(e)
    );
    this.popupForm.addEventListener("submit", (e) =>
      this.handleNewTaskFormSubmit(e)
    );

    // Show the pop-up when the "Add Task" button is clicked
    this.showPopupButton.addEventListener("click", () => {
      this.popupForm.reset(); // Clear the form
      this.isFormVisible = true; // Set the form as visible
      this.toggleFormVisibility();
    });

    // Close the pop-up when the "Close" button is clicked
    this.closePopupButton.addEventListener("click", () => {
      this.isFormVisible = false; // Set the form as not visible
      this.toggleFormVisibility();
    });

    // Edit button event listener
    this.tasksContainer.addEventListener("click", (e) => {
      const editButton = e.target.closest(".edit-task-button");
      if (editButton) {
        const task = editButton.closest(".task");
        this.handleEditButtonClick(task);
      }
    });
  }

  handleListClick(e) {
    if (e.target.tagName.toLowerCase() === "li") {
      this.selectedListsId = e.target.dataset.listId;
      this.saveAndRender();
    }
  }

  handleClearButtonClick(e) {
    const selectedList = this.getSelectedList();
    selectedList.tasks = selectedList.tasks.filter((task) => !task.complete);
    this.saveAndRender();
  }

  handleDeleteListButtonClick(e) {
    this.lists = this.lists.filter((list) => list.id !== this.selectedListsId);
    this.selectedListsId = null;
    this.saveAndRender();
  }

  handleTaskCheckboxClick(e) {
    if (e.target.tagName.toLowerCase() === "input") {
      const selectedList = this.getSelectedList();
      const selectedTask = selectedList.tasks.find(
        (task) => task.id === e.target.id
      );

      // Toggle the completion status of the selected task
      selectedTask.complete = e.target.checked;

      // Apply the "completed" class to all task elements based on the completion status
      const taskElements = document.querySelectorAll(".task");
      taskElements.forEach((taskElement) => {
        const taskId = taskElement.querySelector("input").id;
        const task = selectedList.tasks.find((task) => task.id === taskId);
        if (task.complete) {
          taskElement.classList.add("completed");
        } else {
          taskElement.classList.remove("completed");
        }
      });

      this.save();
      this.renderTaskCount(selectedList);
    }
  }

  handleNewListFormSubmit(e) {
    e.preventDefault();
    const listName = this.newListInput.value.trim();
    if (listName === "") return;
    const list = this.createList(listName);
    this.newListInput.value = "";
    this.lists.push(list);
    this.saveAndRender();
  }

  handleNewTaskFormSubmit(e) {
    // Get values from the task form
    const taskTitle = this.popupForm.querySelector("#task-title").value.trim();
    const taskDescription = this.popupForm
      .querySelector("#task-description")
      .value.trim();
    const taskDate = this.popupForm.querySelector("#task-date").value;
    const taskPriority = this.popupForm
      .querySelector("#task-priority-selection")
      .value.trim();
    const taskNotes = this.popupForm.querySelector("#task-notes").value.trim();

    // Check if the title is empty (other fields can be optional)
    if (!taskTitle) {
      alert("Please provide a title for the task.");
      return;
    }

    // Create a new task object
    const newTask = this.createTask(
      taskTitle,
      taskDescription,
      taskDate,
      taskPriority,
      taskNotes
    );

    // Clear the form
    this.popupForm.reset();

    // Add the new task to the selected list
    const selectedList = this.getSelectedList();
    selectedList.tasks.push(newTask);

    // Save and render
    this.saveAndRender();

    // Close the form explicitly
    this.isFormVisible = false;
    this.toggleFormVisibility();
  }

  // Function to toggle between read-only and editable state for a specific task
  toggleEditing() {
    // Toggle the contentEditable attribute and the "editable" class
    this.editableElements.forEach((element) => {
      if (element.contentEditable === "true") {
        element.contentEditable = "false";
        element.classList.remove("editable");
      } else {
        element.contentEditable = "true";
        element.classList.add("editable");
      }
    });

    // Toggle the text content of the edit button
    this.editButton.textContent =
      this.editButton.textContent === "Enable Editing"
        ? "Disable Editing"
        : "Enable Editing";
  }

  handleEditButtonClick(task) {
    // Toggle editable content within task-details div
    const taskDetails = task.querySelector(".task-details");
    const taskElements = taskDetails.querySelectorAll(".editable");

    taskElements.forEach((element) => {
      const isEditable = element.getAttribute("contenteditable") === "true";

      if (isEditable) {
        element.setAttribute("contenteditable", "false");
        element.classList.remove("editable");
      } else {
        element.setAttribute("contenteditable", "true");
        element.classList.add("editable");
      }
    });

    // Toggle the "active" class on the Edit button
    const editButton = task.querySelector(".edit-task-button");
    editButton.classList.toggle("active");

    // Update the task data with the edited content
    const selectedList = this.getSelectedList();
    const taskId = task.querySelector("input").id;
    const selectedTask = selectedList.tasks.find((task) => task.id === taskId);

    const title = task.querySelector("label");
    const description = taskDetails.querySelector(".task-description");
    const date = taskDetails.querySelector(".task-date");
    const priority = taskDetails.querySelector(".task-priority");
    const notes = taskDetails.querySelector(".task-notes");

    // Update the title separately
    selectedTask.name = title.textContent;

    selectedTask.description = description.textContent;
    selectedTask.date = date.textContent.split(":")[1].trim();
    selectedTask.priority = priority.textContent.split(":")[1].trim();
    if (selectedTask.priority) {
      switch (selectedTask.priority.toLowerCase()) {
        case "high":
          priority.style.color = "#f11c1c";
          break;
        case "medium":
          priority.style.color = "#fdac15";
          break;
        case "low":
          priority.style.color = "green";
          break;
        default:
          // Handle other cases or leave it as-is
          break;
      }
    }
    selectedTask.notes = notes.textContent.split(":")[1].trim();

    // Save the updated task data
    this.save();
  }

  toggleEditing(element) {
    if (element) {
      // Check if element is defined
      element.contentEditable =
        element.contentEditable === "true" ? "false" : "true";
      element.classList.toggle("editable");
    }
  }

  createList(name) {
    return { id: Date.now().toString(), name: name, tasks: [] };
  }

  createTask(name, description, date, priority, notes) {
    return {
      id: Date.now().toString(),
      name: name,
      complete: false,
      description: description,
      date: date,
      priority: priority,
      notes: notes,
    };
  }

  saveAndRender() {
    this.save();
    this.render();
  }

  save() {
    localStorage.setItem(
      this.LOCAL_STORAGE_LIST_KEY,
      JSON.stringify(this.lists)
    );
    localStorage.setItem(
      this.LOCAL_STORAGE_SELECTED_LIST_ID_KEY,
      this.selectedListsId
    );
  }

  render() {
    this.clearElement(this.listsContainer);
    this.renderLists();
    const selectedList = this.getSelectedList();
    if (!selectedList) {
      this.listDisplayContainer.style.display = "none";
    } else {
      this.listDisplayContainer.style.display = "";
      this.listTitle.innerText = selectedList.name;
      this.renderTaskCount(selectedList);
      this.clearElement(this.tasksContainer);
      this.renderTasks(selectedList);
    }
  }

  renderTasks(selectedList) {
    selectedList.tasks.forEach((task) => {
      const taskElement = document.importNode(this.taskTemplate.content, true);
      const taskId = task.id; // Unique task ID
      const checkbox = taskElement.querySelector("input");

      checkbox.id = taskId;
      checkbox.checked = task.complete;

      const label = taskElement.querySelector("label");
      label.htmlFor = taskId;
      label.append(task.name);

      const description = taskElement.querySelector(".task-description");
      description.textContent = task.description || "N/A"; // Updated this line

      const date = taskElement.querySelector(".task-date");
      date.textContent = `Due Date: ${task.date || "N/A"}`;

      const priority = taskElement.querySelector(".task-priority");
      priority.textContent = `Priority: ${task.priority || "N/A"}`;
      if (task.priority) {
        switch (task.priority.toLowerCase()) {
          case "high":
            priority.style.color = "#f11c1c";
            break;
          case "medium":
            priority.style.color = "#fdac15";
            break;
          case "low":
            priority.style.color = "green";
            break;
          default:
            // Handle other cases or leave it as-is
            break;
        }
      }

      const notes = taskElement.querySelector(".task-notes");
      notes.textContent = `Notes: ${task.notes || "N/A"}`;

      // Add edit button and click event listener
      const editButton = taskElement.querySelector(".edit-task-button");
      editButton.addEventListener("click", () =>
        this.handleEditButtonClick(task)
      );

      const deleteButton = taskElement.querySelector(".delete-task-button");
      deleteButton.addEventListener("click", () => {
        selectedList.tasks = selectedList.tasks.filter((t) => t.id !== taskId);

        this.saveAndRender();
      });

      this.tasksContainer.appendChild(taskElement);
    });
  }

  renderTaskCount(selectedList) {
    if (selectedList) {
      const incompleteTaskCount = selectedList.tasks.filter(
        (task) => !task.complete
      ).length;
      const taskString = incompleteTaskCount === 1 ? "task" : "tasks";
      this.listCount.innerText = `${incompleteTaskCount} ${taskString} remaining`;
    } else {
      this.listCount.innerText = "";
    }
  }

  renderLists() {
    this.lists.forEach((list) => {
      const listElement = document.createElement("li");
      listElement.dataset.listId = list.id;
      listElement.classList.add("list-name");
      listElement.innerText = list.name;
      if (list.id === this.selectedListsId) {
        listElement.classList.add("active-list");
      }
      this.listsContainer.appendChild(listElement);
    });
  }

  clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  getSelectedList() {
    return this.lists.find((list) => list.id === this.selectedListsId);
  }

  toggleFormVisibility() {
    const popup = document.querySelector(".popup");
    if (this.isFormVisible) {
      popup.style.display = "block";
    } else {
      popup.style.display = "none";
    }
  }
}

export default TaskManager;
