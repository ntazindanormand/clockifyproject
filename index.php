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
<!--<script>
    // Function to save task and priority
    async function saveTaskAndPriority(taskData) {
        try {
            // Save task in main task table
            const taskResponse = await fetch('save_task.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            const { taskId } = await taskResponse.json();

            // Save priority in task_priority table
            const priorityResponse = await fetch('save_priority.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: taskData.priorityId, name: taskData.priorityName })
            });
            const { priorityId } = await priorityResponse.json();

            return { taskId, priorityId };
        } catch (error) {
            console.error('Error saving task and priority:', error);
            throw error;
        }
    }

    // Event listener for form submission
    document.getElementById('Data').addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Assuming 'priority' is the name attribute of your priority dropdown
        const priorityDropdown = document.querySelector('select[name="priority"]');
        const selectedPriorityId = priorityDropdown.value;
        const selectedPriorityName = priorityDropdown.options[priorityDropdown.selectedIndex].text;

        // Other form data
        const formData = new FormData(this);
        const taskData = {};
        for (const [key, value] of formData.entries()) {
            taskData[key] = value;
        }

        // Add priority ID and name to task data
        taskData.priorityId = selectedPriorityId;
        taskData.priorityName = selectedPriorityName;

        try {
            // Save task and priority
            const { taskId, priorityId } = await saveTaskAndPriority(taskData);
            console.log('Task ID:', taskId);
            console.log('Priority ID:', priorityId);
            // Optionally, display a success message to the user
        } catch (error) {
            // Optionally, display an error message to the user
        }
    });

</script>

-->

<script src="script.js"></script>
</body>
</html>
