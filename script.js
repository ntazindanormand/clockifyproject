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
function addTaskRow(task) {
    // Check if task date properties are defined and valid
    const date_created = task.date_created ? task.date_created.split(' ')[0] : ''; // Extract date part and handle undefined
    const due_date = task.due_date ? task.due_date.split(' ')[0] : ''; // Extract date part and handle undefined

    // Generate a unique ID for priority dropdown
    const priorityId = `priority-${Math.random().toString(36).substr(2, 9)}`;

    const newRowElement = document.createElement('tr');
    newRowElement.innerHTML = `
        <td><input type="date" name="date_created" value="${date_created}" style="border: none;"></td>
        <td>${task.project_name}</td>
        <td>${task.task_name}</td>
        <td><input type="text" name="description" value="${task.description || ''}"></td>
        <td><button class="up">↑</button><button class="down">↓</button></td>
        <td><input type="date" name="due_date" value="${due_date}" style="border: none;"></td>
        <td><select name="priority" id="${priorityId}">
            <option value="1">High</option>
            <option value="2">Normal</option>
            <option value="3">Low</option>
        </select></td>
        <td>${task.created_by || ''}</td>
        <td>${task.assigned_to || ''}</td>
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

    // Add event listeners for buttons
    newRowElement.querySelector('.start').addEventListener('click', function() {
        currentTimer = startTimer(newRowElement);
    });

    newRowElement.querySelector('.stop').addEventListener('click', function() {
        const rowElement = this.closest('tr');
        stopCurrentTimer(rowElement);
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
    stopCurrentTimer();

    const startButton = rowElement.querySelector('.start');
    const stopButton = rowElement.querySelector('.stop');
    const projectId = projectDropdown.value;
    const taskId = taskDropdown.value;
    // Use stopButton to control display
    startButton.style.display = 'none';
    stopButton.style.display = 'inline';

    let timerInterval; // Variable to hold the timer interval

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
            if (!data.id) {
                throw new Error('Failed to retrieve time entry ID');
            }
            startButton.style.display = 'none';
            stopButton.style.display = 'inline';
            rowElement.dataset.timeEntryId = data.id; // Store the time entry ID

            let seconds = 0;
            timerInterval = setInterval(() => {
                seconds++;
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secondsLeft = seconds % 60;
                rowElement.querySelector('.timer-display').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
            }, 1000);
        })
        .catch(error => {
            console.error('Error starting timer on Clockify:', error);
            // Optionally, you can display an error message to the user
            // alert('Failed to start timer. Please try again later.');
        });

    // Return the time entry ID and the stop function
    return {
        stop: () => {
            clearInterval(timerInterval); // Stop the timer interval
            stopButton.style.display = 'none'; // Hide the stop button
        }
    };
}

function stopCurrentTimer(rowElement) {
    console.log("Stopping timer..."); // Debugging statement
    if (!rowElement) {
        console.log("No row element provided."); // Debugging statement
        return; // No timer running
    }

    const stopButton = rowElement.querySelector('.stop');
    const timeEntryId = rowElement.dataset.timeEntryId; // Get the time entry ID

    console.log("Time entry ID:", timeEntryId); // Debugging statement

    const userId = userDropdown.value; // Retrieve the user ID

    // Use stopButton to control display
    stopButton.style.display = 'inline';

    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify({
            end: new Date().toISOString() // Set the end time to the current time
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
    }
}

function moveDown() {
    const row = this.closest('tr');
    if (row.nextElementSibling) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
    }
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
