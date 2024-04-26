document.addEventListener('DOMContentLoaded', function() {
    fetchProjects();
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
    userDropdown.innerHTML = '<option value="">Select User</option>';
    fetch(`https://api.clockify.me/api/v1/user`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    })
        .then(response => response.json())
        .then(data => {
            let option = new Option(data.name, data.id);
            userDropdown.add(option);
        })
        .catch(error => console.error('Error fetching users:', error));
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

async function addTaskRow(task, workspaceId) {
    try {
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
          // fetch created by data
        const createdUserResponse = await fetch('https://api.clockify.me/api/v1/user', {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const createdUserData = await createdUserResponse.json();
        const createdBy = createdUserData ? createdUserData.name : 'Unknown User';

                 //fetch assigned to Data
        const assignedUserResponse = await fetch('https://api.clockify.me/api/v1/user', {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });
        const assignedUserData = await assignedUserResponse.json();
        const assignedTo = assignedUserData ? assignedUserData.name : 'Unknown User';


        const dateCreated = task.date_created ? task.date_created.split(' ')[0] : '';
        const dueDate = task.due_date ? task.due_date.split(' ')[0] : '';

        const newRow = document.createElement('tr');

        newRow.dataset.clockifyProjectId = task.clockify_project_id;
        newRow.dataset.clockifyTaskId = task.clockify_task_id;
        newRow.dataset.workspaceId = workspaceId;
        newRow.innerHTML = `
            <td><input type="date" name="date_created" value="${dateCreated}" style="border: none;"></td>
           <td><select name="project">
           <option value="${task.name}">${projectName}</option>
           </select></td>

            <td><select name="task">
           <option value="${task.name}">${taskName}</option>
           </select></td>

            <td><input type="text" name="description" value="${task.description || ''}"></td>
            <td><button class="up">↑</button><button class="down">↓</button></td>
            <td><input type="date" name="due_date" value="${dueDate}" style="border: none;"></td>
            <td><select name="priority">
                <option value="1">High</option>
                <option value="2">Normal</option>
                <option value="3">Low</option>
            </select></td>
          <td><select name="created_by">
           <option value="${task.created_by}">${createdBy}</option>
           </select></td>
           <td><select name="assigned_to">
          <option value="${task.assigned_to}">${assignedTo}</option>
          </select></td>

            <td><select name="task-status">
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Review">Review</option>
            </select></td>
            <td class="timer"><div><button class="start">Start</button><button class="stop" style="display: none;">Stop</button></div></td>
            <td class="timer-display">00:00:00</td>
            <td><button class="delete">Delete</button></td>
        `;
        const taskTableBody = document.querySelector('.task-table tbody');
        taskTableBody.appendChild(newRow);


        newRow.querySelector('.start').addEventListener('click', function() {
            startTimer(newRow);
        });

        newRow.querySelector('.stop').addEventListener('click', function() {
            stopTimer(newRow);
        });

        newRow.querySelector('.delete').addEventListener('click', function() {
            deleteTask(newRow);
        });

        newRow.querySelector('.up').addEventListener('click', moveUp);
        newRow.querySelector('.down').addEventListener('click', moveDown);

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
    addTaskRow(task, workspaceId); // Pass workspaceId as an argument
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

    startTimerOnClockify(projectId, taskId, startTime, description, workspaceId) // Pass workspaceId to startTimerOnClockify
        .then(() => console.log('Timer started on Clockify'))
        .catch(error => console.error('Error starting timer on Clockify:', error));
    clearInterval(timerInterval);
    // Set up a new interval to update the timer display every second
    timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        updateTimerDisplay(row, elapsedTime);
    }, 1000);
}



async function startTimerOnClockify(projectId, taskId, startTime,description,workspaceId) {
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

async function stopTimer(row) {
    const startButton = row.querySelector('.start');
    const stopButton = row.querySelector('.stop');
    const stopTime = new Date();

    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';

    const startTime = parseInt(row.dataset.startTime);
    const elapsedTime = stopTime.getTime() - startTime;
    const formattedTime = formatElapsedTime(elapsedTime);

    // Update the timer display
    updateTimerDisplay(row, elapsedTime);

    // Fetch workspaceId and userId from the row
    const workspaceId = row.dataset.workspaceId;
    const userId = row.dataset.userId;

    // Stop the timer on Clockify
    await stopTimerOnClockify(workspaceId, userId, stopTime);

    console.log('Timer stopped');
}


function updateTimerDisplay(row, elapsedTime) {
    // Convert elapsed time in milliseconds to hours, minutes, and seconds
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);

    // Format the time components as HH:MM:SS
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update the timer display in the row
    const timerDisplay = row.querySelector('.timer-display');
    timerDisplay.textContent = formattedTime;
}


async function stopTimerOnClockify(workspaceId, userId, stopTime) {
    try {
        const response = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`, {
            method: 'PATCH',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                end: stopTime.toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to stop timer on Clockify');
        }
    } catch (error) {
        console.error('Error stopping timer on Clockify:', error);
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
                fetchTasksFromServer();
            } else {
                console.error('Error adding task:', responseData.message);
            }
        })
        .catch(error => {
            console.error('Error submitting form data:', error);
        });
});


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
                addTaskRow(task, workspaceId); // Pass workspaceId to addTaskRow
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}
