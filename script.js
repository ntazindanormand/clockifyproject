let UserId;
document.addEventListener('DOMContentLoaded', function() {

    fetchProjects();
    fetchUsers();
});

const apiKey = 'NTNlOTEyNWQtOGI2Yy00MjMzLTgxMDEtYzU1ZjBkOGU3NjIz';
const workspaceId = '66016daed4084c6ca1059c4b';

const projectDropdown = document.getElementById('project');
const taskDropdown = document.getElementById('tasks');
const userDropdown = document.getElementById('user');

function fetchProjects() {
    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    })
        .then(response => response.json())
        .then(projects => {
            projectDropdown.innerHTML = '<option value="">Select Project</option>';
            projects.forEach(project => {
                let option = new Option(project.name, project.id);
                projectDropdown.add(option);
            });
        })
        .catch(error => console.error('Error fetching projects:', error));
}

function fetchTasks(projectId) {
    taskDropdown.innerHTML = '<option value="">Select Task</option>';
    if (!projectId) return;
    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    })
        .then(response => response.json())
        .then(tasks => {
            tasks.forEach(task => {
                let option = new Option(task.name, task.id);
                taskDropdown.add(option);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

function fetchUsers() {
    // Fetch user data
    fetch(`https://api.clockify.me/api/v1/user`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            return response.json();
        })
        .then(user => {
            // Assign the user ID to the global UserId variable
            UserId = user.id;
            console.log('User ID:', UserId); // Log the user ID

            // Populate user dropdown
            const userDropdown = document.getElementById('user');
            userDropdown.innerHTML = ''; // Clear previous options
            const option = new Option(user.name, user.id);
            userDropdown.add(option);

            // Handle additional logic related to the user data here

            // Add other logic as needed
        })
        .catch(error => console.error('Error fetching user:', error));
}

projectDropdown.addEventListener('change', function() {
    const projectId = this.value;
    fetchTasks(projectId);
    fetchUsers();
});

async function fetchWorkspaceId(apiKey) {
    try {
        const response = await fetch('https://api.clockify.me/api/v1/workspaces', {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const workspaces = await response.json();
        if (workspaces.length > 0) {
            return workspaces[0].id; // Return the ID of the first workspace
        } else {
            console.error('No workspaces found for the user');
            return null;
        }
    } catch (error) {
        console.error('Error fetching workspace ID:', error);
        return null;
    }
}

async function addTaskRow(task, workspaceId, UserId) {
    try {
        // Fetch user data
        const userResponse = await fetch(`https://api.clockify.me/api/v1/user/`, {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const userData = await userResponse.json();
        const userName = userData ? userData.name : 'Unknown User';

        // Fetch project data
        const projectResponse = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${task.clockify_project_id}`, {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const projectData = await projectResponse.json();
        const projectName = projectData ? projectData.name : 'Unknown Project';

        // Fetch task data
        const taskResponse = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${task.clockify_project_id}/tasks/${task.clockify_task_id}`, {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const taskData = await taskResponse.json();
        const taskName = taskData ? taskData.name : 'Unknown Task';

        const dateCreated = task.date_created ? task.date_created.split(' ')[0] : '';
        const dueDate = task.due_date ? task.due_date.split(' ')[0] : '';

        // Fetch the current number of tasks in the table
        const taskTableBody = document.querySelector('.task-table tbody');
        const sortOrder = taskTableBody.children.length + 1;

        const newRow = document.createElement('tr');

        newRow.dataset.clockifyProjectId = task.clockify_project_id;
        newRow.dataset.clockifyTaskId = task.clockify_task_id;
        newRow.dataset.workspaceId = workspaceId;
        newRow.dataset.UserId = UserId;
        newRow.dataset.description = task.description || '';

        newRow.innerHTML = `
            <td><input type="date" name="date_created" value="${dateCreated}" style="border: none;"></td>
            <td><select name="project">
                <option value="${task.clockify_project_id}">${projectName}</option>
            </select></td>
            <td><select name="task">
                <option value="${task.clockify_task_id}">${taskName}</option>
            </select></td>
            <td><input type="text" name="description" value="${task.description || ''}"></td>
            <td><button class="up">↑</button><button class="down">↓</button></td>
            <td><input type="date" name="due_date" value="${dueDate}" style="border: none;"></td>
            <td>
        <select name="priority" onchange="updateTaskPriority(this)">
            <option value="1">High</option>
            <option value="2">Normal</option>
            <option value="3">Low</option>
        </select>
    </td>

            <td><select name="created_by">
                <option value="${UserId}">${userName}</option>
            </select></td>
            <td><select name="assigned_to">
                <option value="${UserId}">${userName}</option>
            </select></td>
            <td><select name="task-status" onchange="updateTaskStatus(this)">
                <option value="1">In Progress</option>
                <option value="2">Completed</option>
                <option value="3">Review</option>
            </select></td>
            <td class="timer"><div><button class="start">Start</button><button class="stop" style="display: none;">Stop</button></div></td>
            <td class="timer-display">00:00:00</td>
            <td><button class="delete">Delete</button></td>
        `;

        // Include sort order in the row
        newRow.dataset.sortOrder = sortOrder;

        // Append the new row to the table
        taskTableBody.appendChild(newRow);

        // Add event listeners for buttons in the new row
        newRow.querySelector('.start').addEventListener('click', function() {
            const UserId = newRow.dataset.UserId; // Retrieve UserId from the dataset of the row
            startTimer(newRow, UserId); // Pass UserId when starting the timer
        });

        newRow.querySelector('.stop').addEventListener('click', function() {
            stopTimer(newRow);
        });

        newRow.querySelector('.delete').addEventListener('click', function() {
            deleteTask(newRow);
        });

        newRow.querySelector('.up').addEventListener('click', moveUp);
        newRow.querySelector('.down').addEventListener('click', moveDown);

        // Update sort order in the table
        updateSortOrder();
    } catch (error) {
        console.error('Error adding task row:', error);
    }
}

document.getElementById('addTaskBtn').addEventListener('click', async function() {
    const workspaceId = await fetchWorkspaceId(apiKey); // Fetch workspaceId
    if (!workspaceId) {
        console.error('Failed to fetch workspace ID');
        return;
    }
    const UserId = document.getElementById('user').value; // Retrieve UserId from the user dropdown
    console.log('User ID:', UserId); // Log the user ID
});

function moveUp() {
    const row = this.closest('tr');
    if (row.previousElementSibling) {
        row.parentNode.insertBefore(row, row.previousElementSibling);
        updateSortOrder();
    }
}

function moveDown() {
    const row = this.closest('tr');
    if (row.nextElementSibling) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
        updateSortOrder();
    }
}

function updateSortOrder() {
    const priorityDropdowns = document.querySelectorAll('select[name="priority"]');
    priorityDropdowns.forEach((dropdown, index) => {
        dropdown.value = index + 1;
    });
}

function deleteTask(row) {
    row.remove();
}


let timerInterval;

async function startTimer(row) {
    console.log('Row dataset:', JSON.stringify(row.dataset));

    const projectId = row.dataset.clockifyProjectId;
    const taskId = row.dataset.clockifyTaskId;
    const description = row.querySelector('input[name="description"]').value; // Retrieve description from input field
    const startButton = row.querySelector('.start');
    const stopButton = row.querySelector('.stop');

    const startTime = new Date();
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';

    row.dataset.startTime = startTime.getTime();
    row.dataset.clockifyProjectId = projectId;
    row.dataset.clockifyTaskId = taskId;
    const workspaceId = row.dataset.workspaceId; // Get workspaceId from the row

    console.log(`Starting timer for User ID: ${UserId}, Workspace ID: ${workspaceId}`);
    console.log('Row dataset before starting:', JSON.stringify(row.dataset));

    startTimerOnClockify(projectId, taskId, startTime, description, workspaceId,UserId)
        .then(timeEntryId => {
            console.log('Timer started on Clockify');
            row.dataset.timeEntryId = timeEntryId; // Store the time entry ID in the row's dataset
            row.dataset.UserId = UserId; // Store the UserId in the row's dataset
            console.log('Row dataset after starting:', JSON.stringify(row.dataset));
        })
        .catch(error => console.error('Error starting timer on Clockify:', error));

    clearInterval(timerInterval);
    // Set up a new interval to update the timer display every second
    timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        updateTimerDisplay(row, elapsedTime);
    }, 1000);
}

async function startTimerOnClockify(projectId, taskId, startTime, description, workspaceId) {
    try {
        const response = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                billable: true, // Set to true if the entry is billable
                description: description, // Set the description for the time entry
                start: startTime.toISOString(), // Convert start time to ISO string
                projectId: projectId, // Project ID
                taskId: taskId, // Task ID
                type: 'REGULAR' // Type of time entry
            })
        });

        if (!response.ok) {
            throw new Error('Failed to start timer on Clockify');
        }

        const responseData = await response.json();
        return responseData.id; // Return the ID of the created time entry
    } catch (error) {
        throw error;
    }
}

function formatElapsedTime(elapsedTime) {
    // Convert elapsed time in milliseconds to hours, minutes, and seconds
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);

    // Format the time components as HH:MM:SS
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return formattedTime;
}


function updateTimerDisplay(row, elapsedTime) {
    // Convert elapsed time in milliseconds to hours, minutes, and seconds
    let hours = Math.floor(elapsedTime / 3600000);
    let minutes = Math.floor((elapsedTime % 3600000) / 60000);
    let seconds = Math.floor((elapsedTime % 60000) / 1000);

    // Format the time components as HH:MM:SS
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update the timer display in the row
    const timerDisplay = row.querySelector('.timer-display');
    timerDisplay.textContent = formattedTime;
}

async function stopTimer(row) {
    let startButton = row.querySelector('.start');
    let stopButton = row.querySelector('.stop');
    let stopTime = new Date();

    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';

    let startTime = parseInt(row.dataset.startTime);
    let elapsedTime = stopTime.getTime() - startTime;
    let formattedTime = formatElapsedTime(elapsedTime);

    // Update the timer display
    updateTimerDisplay(row, elapsedTime);

    // Clear the interval responsible for updating the timer display
    clearInterval(timerInterval);

    // Fetch workspaceId, timeEntryId, and UserId from the row
    const workspaceId = row.dataset.workspaceId;
    const timeEntryId = row.dataset.timeEntryId;
    const UserId = row.dataset.UserId;
    console.log('Workspace ID:', workspaceId);
    console.log('Time Entry ID:', timeEntryId);
    console.log('User ID:', UserId);

    // Check if UserId and timeEntryId are defined
    if (!UserId || !timeEntryId) {
        console.error('User ID or Time Entry ID is not defined in the row dataset');
        return;
    }

    // Stop the timer on Clockify
    await stopTimerOnClockify(workspaceId, UserId, timeEntryId, stopTime);
}

async function stopTimerOnClockify(workspaceId, UserId, timeEntryId, endTime) {
    try {
        const response = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${UserId}/time-entries`, {
            method: 'PATCH',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                end: endTime.toISOString() // Set the end time for the time entry
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Time entry not found or already stopped.');
                return; // No need to throw an error, as this is a common scenario
            } else {
                throw new Error('Failed to stop timer on Clockify');
            }
        }

        console.log('Timer stopped on Clockify');
    } catch (error) {
        throw error;
    }
}
document.getElementById('Data').addEventListener('submit', async function(event) {
    event.preventDefault();

    document.getElementById('date_created').value = new Date().toISOString().split('T')[0];
    const workspaceId = await fetchWorkspaceId(apiKey);

    if (!workspaceId) {
        console.error('Failed to fetch workspace ID');
        return;
    }
    // Set the value of other hidden fields based on user selection or some logic
    document.getElementById('created_by').value = document.getElementById('user').value;
    document.getElementById('assigned_to').value = document.getElementById('user').value;
    document.getElementById('clockify_project_id').value = document.getElementById('project').value;
    document.getElementById('clockify_task_id').value = document.getElementById('tasks').value;
    document.getElementById('clockify_workspace_id').value = workspaceId;

    const formData = new FormData(this);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    console.log('JSON data to be sent:', data);

    fetch('database.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(responseData => {
            console.log('Response:', responseData);
            if (responseData.status === 'success') {
                console.log('Task added successfully:', responseData.message);
                // Add the newly added task to the table immediately
                addTaskRow(data, workspaceId, UserId);
            } else {
                console.error('Error adding task:', responseData.message);
            }
        })
        .catch(error => {
            console.error('Error submitting form data:', error);
        });
});

// Task PRIORITY UPDATE FUNCTION
function updateTaskPriority(selectElement) {
    const selectedPriorityId = selectElement.value; // Get the selected priority ID
    const selectedPriorityName = selectElement.options[selectElement.selectedIndex].text; // Get the selected priority name
    const row = selectElement.closest('tr'); // Find the closest row
    const taskId = row.dataset.clockifyTaskId; // Retrieve the task ID from the row dataset
    const projectId = row.dataset.clockifyProjectId; // Retrieve the project ID from the row dataset
    const description = row.dataset.description; // Retrieve the description from the row dataset

    // Log the data before sending the AJAX request
    console.log('Task ID:', taskId);
    console.log('Project ID:', projectId);
    console.log('Description:', description);
    console.log('Priority ID:', selectedPriorityId);
    console.log('Priority Name:', selectedPriorityName);

    // Send an AJAX request to update the task priority
    fetch('database.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taskId: taskId,
            projectId: projectId,
            description: description,
            priorityId: selectedPriorityId,
            priorityName: selectedPriorityName // Pass the priority name
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update task priority');
            }
            console.log('Task priority updated successfully');
        })
        .catch(error => {
            console.error('Error updating task priority:', error);
        });
}

// Task STATUS UPDATE FUNCTION
function updateTaskStatus(selectElement) {
    const selectedStatusId = selectElement.value; // Get the selected status ID
    const selectedStatusName = selectElement.options[selectElement.selectedIndex].text; // Get the selected status name
    const row = selectElement.closest('tr'); // Find the closest row
    const taskId = row.dataset.clockifyTaskId; // Retrieve the task ID from the row dataset
    const projectId = row.dataset.clockifyProjectId; // Retrieve the project ID from the row dataset
    const description = row.dataset.description; // Retrieve the description from the row dataset

    // Log the data before sending the AJAX request
    console.log('Task ID:', taskId);
    console.log('Project ID:', projectId);
    console.log('Description:', description);
    console.log('Status ID:', selectedStatusId);
    console.log('Status Name:', selectedStatusName);

    // Send an AJAX request to update the task status
    fetch('database.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taskId: taskId,
            projectId: projectId,
            description: description,
            statusId: selectedStatusId,
            statusName: selectedStatusName // Pass the status name
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            console.log('Task status updated successfully');
        })
        .catch(error => {
            console.error('Error updating task status:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    fetchTasksFromServer();
});

async function fetchTasksFromServer() {
    const workspaceId = await fetchWorkspaceId(apiKey); // Fetch workspaceId
    if (!workspaceId) {
        console.error('Failed to fetch workspace ID');
        return;
    }

    fetch('database.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            return response.text();
        })
        .then(responseData => {
            const tasks = JSON.parse(responseData).data;
            console.log(tasks);
            if (!Array.isArray(tasks)) {
                throw new Error('Tasks is not an array');
            }
            tasks.forEach(task => {
                addTaskRow(task, workspaceId, UserId); // Pass workspaceId and UserId to addTaskRow
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}