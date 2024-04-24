document.addEventListener('DOMContentLoaded', function() {
    fetchProjects();
});

const apiKey = 'NTNlOTEyNWQtOGI2Yy00MjMzLTgxMDEtYzU1ZjBkOGU3NjIz';
const workspaceId = '66016daed4084c6ca1059c4b';

const projectDropdown = document.getElementById('project');
const taskDropdown = document.getElementById('tasks');
const userDropdown = document.getElementById('user');
let currentTimer = null;
let initialPriority = ''; // Variable to store the initial priority value

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
        }).catch(error => console.error('Error fetching projects:', error));
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
        }).catch(error => console.error('Error fetching tasks:', error));
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
        }).catch(error => console.error('Error fetching users:', error));
}

projectDropdown.addEventListener('change', function() {
    const projectId = this.value;
    fetchTasks(projectId);
    fetchUsers();
});

// Function to fetch workspace ID
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
async function addTaskRow(task) {
    // Check if task date properties are defined and valid
    const date_created = task.date_created ? task.date_created.split(' ')[0] : ''; // Extract date part and handle undefined
    const due_date = task.due_date ? task.due_date.split(' ')[0] : ''; // Extract date part and handle undefined

    // Generate unique IDs for priority dropdown and task dropdown
    const priorityId = `priority-${Math.random().toString(36).substr(2, 9)}`;
    const taskId = `task-${Math.random().toString(36).substr(2, 9)}`;

    // Fetch project name based on clockify_project_id
    const projectResponse = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${task.clockify_project_id}`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    });
    const projectData = await projectResponse.json();
    const projectName = projectData ? projectData.name : 'Unknown Project';

    // Fetch task name based on clockify_task_id
    const taskResponse = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${task.clockify_project_id}/tasks/${task.clockify_task_id}`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    });
    const taskData = await taskResponse.json();
    const taskName = taskData ? taskData.name : 'Unknown Task';

    // Fetch usernames based on user IDs
    const createdUserResponse = await fetch('https://api.clockify.me/api/v1/user', {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    });
    const createdUserData = await createdUserResponse.json();
    const createdBy = createdUserData ? createdUserData.name : 'Unknown User';

    const assignedUserResponse = await fetch('https://api.clockify.me/api/v1/user', {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey }
    });
    const assignedUserData = await assignedUserResponse.json();
    const assignedTo = assignedUserData ? assignedUserData.name : 'Unknown User';

    const newRowElement = document.createElement('tr');
    newRowElement.innerHTML = `
        <td><input type="date" name="date_created" value="${date_created}" style="border: none;"></td>
        <td>${projectName}</td>
        <td>${taskName}</td> <!-- Display task name here -->
        <td><input type="text" name="description" value="${task.description || ''}"></td>
        <td><button class="up">↑</button><button class="down">↓</button></td>
        <td><input type="date" name="due_date" value="${due_date}" style="border: none;"></td>
        <td><select name="priority" id="${priorityId}">
            <option value="1">High</option>
            <option value="2">Normal</option>
            <option value="3">Low</option>
        </select></td>
       <td>${createdBy}</td> <!-- Display created by user here -->
        <td>${assignedTo}</td> <!-- Display assigned to user here -->
        <td><select name="task-status"><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Review">Review</option></select></td>
        <td class="timer"><div><button class="start">Start</button><button class="stop" style="display: none;">Stop</button></div></td>
        <td class="timer-display">00:00:00</td>
        <td><button class="delete">Delete</button></td>
    `;

    const taskTableBody = document.querySelector('.task-table tbody');
    taskTableBody.appendChild(newRowElement);

    // Set the priority input field value based on the selected option
    newRowElement.querySelector('select[name="priority"]').addEventListener('change', function() {
        document.getElementById(priorityId).value = this.value;
    });

    newRowElement.querySelector('.start').addEventListener('click', function() {
        startTimer(newRowElement);
    });

    newRowElement.querySelector('.stop').addEventListener('click', function() {
        const rowElement = this.closest('tr');
        stopTimer(rowElement); // Change this line from stopCurrentTimer to stopTimer
    });


    newRowElement.querySelector('.delete').addEventListener('click', function() {
        deleteTask(newRowElement);
    });
    newRowElement.querySelector('.up').addEventListener('click', moveUp);
    newRowElement.querySelector('.down').addEventListener('click', moveDown);
}


document.getElementById('addTaskBtn').addEventListener('click', addTaskRow);
function startTimer(rowElement) {
    // Ensure no other timers are running
    stopTimer(rowElement);

    const startButton = rowElement.querySelector('.start');
    const stopButton = rowElement.querySelector('.stop');
    const projectId = projectDropdown.value;
    const taskId = taskDropdown.value;
    const userId = userDropdown.value; // Retrieve the user ID from the dropdown

    console.log('Starting timer...'); // Debug message

    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify({
            start: new Date().toISOString(),
            projectId: projectId,
            taskId: taskId,
            userId: userId, // Include the user ID
            billable: 'true'
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to start timer on Clockify');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received from Clockify:', data); // Debugging message
            if (!data.id) {
                throw new Error('Failed to retrieve time entry ID');
            }
            console.log('Timer started successfully'); // Debugging message
            startButton.style.display = 'none';
            stopButton.style.display = 'inline';
            rowElement.dataset.timeEntryId = data.id; // Store the time entry ID
            let seconds = 0;
            const timerInterval = setInterval(() => {
                seconds++;
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secondsLeft = seconds % 60;
                rowElement.querySelector('.timer-display').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
            }, 1000);

            // Store the interval in a data attribute for later use
            rowElement.dataset.timerInterval = timerInterval;
        })
        .catch(error => {
            console.error('Error starting timer on Clockify:', error);
            // Optionally, you can display an error message to the user
            // alert('Failed to start timer. Please try again later.');
        });
}

function stopTimer(rowElement) {
    console.log("Stopping timer..."); // Debugging statement
    if (!rowElement) {
        console.log("No row element provided."); // Debugging statement
        return; // No timer running
    }

    const stopButton = rowElement.querySelector('.stop');
    const timeEntryId = rowElement.dataset.timeEntryId; // Get the time entry ID from the dataset
    const userId = userDropdown.value; // Retrieve the user ID from the dropdown

    console.log("Time entry ID:", timeEntryId); // Debugging statement

    if (!userId) {
        console.error('User ID is empty');
        return;
    }

    // Use stopButton to control display
    stopButton.style.display = 'inline';
    console.log(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`);
    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify({
            end: new Date().toISOString(), // Set the end time to the current time
            id: timeEntryId // Include the time entry ID in the request
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to stop timer on Clockify');
            }
            console.log('Timer stopped successfully');
        })
        .catch(error => {
            console.error('Error stopping timer on Clockify:', error);
            // Optionally, you can display an error message to the user
            // alert('Failed to stop timer. Please try again later.');
        });
}


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
document.getElementById('Data').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Set the value of the hidden date_created field to the current date
    document.getElementById('date_created').value = new Date().toISOString().split('T')[0];

    // Fetch workspace ID dynamically
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

    // Create JSON object from FormData
    const formData = new FormData(this);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    console.log('JSON data to be sent:', data);

    // Send form data to the server
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
                // After successfully adding a task, fetch tasks from the server again to update the task list
                fetchTasksFromServer();
            } else {
                console.error('Error adding task:', responseData.message);
            }
        })
        .catch(error => {
            console.error('Error submitting form data:', error);
        });
})


// fetching records
document.addEventListener('DOMContentLoaded', function() {
    fetchTasksFromServer();
});
function fetchTasksFromServer() {
    fetch('database.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            return response.text(); // Read response as text
        })
        .then(responseData => {

            const tasks = JSON.parse(responseData).data; // Attempt to parse JSON
            console.log(tasks); // Debugging statement
            if (!Array.isArray(tasks)) {
                throw new Error('Tasks is not an array');
            }
            tasks.forEach(task => {
                addTaskRow(task);
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}
