<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Management Tool</title>

</head>
<body>
<form id="Data" method="post" action="database.php">
    <div class="task-container">
        <div class="filters">
            <label for="project">Select Project:</label>
            <select name="project" id="project" class="project"></select>

            <label for="task">Select Task:</label>
            <select name="task" id="tasks" class ="tasks"></select>

            <label for="user">Choose User:</label>
            <select name="user" id="user"></select>

            <label for="due_date">Due Date:</label>
            <input type="date" name="due_date" id="due_date">

            <label for="description">Description:</label>
            <input type="text" name="description" id="description" placeholder="Enter description">

            <!-- Hidden input fields -->
            <input type="hidden" name="date_created" id="date_created">
            <input type="hidden" name="created_by" id="created_by">
            <input type="hidden" name="assigned_to" id="assigned_to">
            <input type="hidden" name="clockify_project_id" id="clockify_project_id">
            <input type="hidden" name="clockify_task_id" id="clockify_task_id">
            <input type="hidden" name="clockify_workspace_id" id="clockify_workspace_id">
            <input type="hidden" name="priority" id="priority" value="">
            <input type="hidden" class="task-id" value="${task.id}">


            <button type="submit" id="addTaskBtn">ADD TASK</button>
            <label for="show-completed">
                <input type="checkbox" name="show-completed" id="show-completed"> Show Completed Tasks
            </label>

            <label for="assigned-tasks">
                <input type="checkbox" name="assigned-tasks" id="assigned-tasks"> Tasks Assigned to Me
            </label>
        </div>
    </div>
</form>

<!-- Tasks Display Table -->
<table class="task-table">
    <thead>
    <tr>
        <th>Date Created</th>
        <th>Description</th>
        <th></th>
        <th></th>
        <th>sort</th>
        <th>Due Date</th>
        <th>Priority</th>
        <th>Created By</th>
        <th>Assign To</th>
        <th>Task Status</th>
        <th>Timer</th>
        <th>Hours Worked</th>
        <th></th>


    </tr>
    </thead>
    <tbody></tbody>
</table>

<div id="recordsContainer"></div>

<script src="script.js"></script>
</body>
</html>
