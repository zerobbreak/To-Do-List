import "./style.css";
import TaskManager from "./TaskManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const taskManager = new TaskManager();

  // Create a default list if no lists exist
  if (taskManager.lists.length === 0) {
    taskManager.createDefaultList();
  }

  // Function to add event listener with optional preventDefault
  const addEventListenerWithPreventDefault = (
    element,
    event,
    callback,
    preventDefault = false
  ) => {
    if (element) {
      element.addEventListener(event, (e) => {
        if (preventDefault) {
          e.preventDefault();
        }
        callback(e);
      });
    }
  };

  // Attach event listeners using the above function
  addEventListenerWithPreventDefault(
    taskManager.newListForm,
    "submit",
    taskManager.handleNewListFormSubmit,
    true
  );
  addEventListenerWithPreventDefault(
    taskManager.clearButton,
    "click",
    taskManager.handleClearButtonClick
  );
  addEventListenerWithPreventDefault(
    taskManager.deleteListButton,
    "click",
    taskManager.handleDeleteListButtonClick
  );
  addEventListenerWithPreventDefault(
    taskManager.popupForm,
    "submit",
    taskManager.handleNewTaskFormSubmit,
    true
  );

  if (taskManager.tasksContainer) {
    taskManager.tasksContainer.addEventListener("click", (e) => {
      const task = e.target.closest(".task");
      if (e.target.type === "checkbox") {
        taskManager.handleTaskCheckboxClick(e);
      } else if (e.target.classList.contains("edit-task-button")) {
        taskManager.handleEditButtonClick(task);
      }
    });
  }

  // Attach click event listener to show popup
  addEventListenerWithPreventDefault(
    taskManager.showPopupButton,
    "click",
    () => {
      taskManager.popupForm.reset();
      taskManager.isFormVisible = true;
      taskManager.toggleFormVisibility();
    }
  );

  // Attach click event listener to close popup
  addEventListenerWithPreventDefault(
    taskManager.closePopupButton,
    "click",
    () => {
      taskManager.isFormVisible = false;
      taskManager.toggleFormVisibility();
    }
  );

  if (taskManager.listsContainer) {
    taskManager.listsContainer.addEventListener(
      "click",
      taskManager.handleListClick
    );
  }
});
