<?php
// Function to connect to the SQLite database
function connectDatabase(): SQLite3
{
    $db = new SQLite3('Datasave.sqlite');
    if (!$db) {
        throw new Exception('Failed to connect to the database');
    }
    return $db;
}

// Function to fetch tasks from the database
function fetchTasks($db): array
{
    $result = $db->query('SELECT t.*, 
                                tp.name AS priority_name, 
                                ts.name AS status_name
                         FROM task t 
                         LEFT JOIN task_priority tp ON t.task_priority_id = tp.id
                         LEFT JOIN task_status ts ON t.task_status_id = ts.id
                         ORDER BY t.date_created DESC');
    $tasks = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        // Include project name
        $row['project_name'] = getProjectName($row['clockify_project_id'], $db);
        $tasks[] = $row;
    }
    return $tasks;
}

// Function to retrieve project name based on project ID
function getProjectName($projectId, $db) {
    // Fetch project name from the task table based on project ID
    $query = "SELECT name FROM task WHERE id = $projectId";
    $result = $db->querySingle($query);
    return $result ? $result : 'Unknown Project'; // Default to 'Unknown Project' if not found
}

// Handle POST requests to add a task
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Process JSON input
    $json_data = file_get_contents('php://input');
    if(empty($json_data)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Received empty JSON data']);
        exit;
    }

    // Debug statement to log decoded JSON data
    var_dump($json_data);

    $form_data = json_decode($json_data, true);
    if ($form_data === null) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Failed to decode JSON data']);
        exit;
    }

    try {
        // Connect to the database
        $db = connectDatabase();

        // Prepare SQL statement for priority insertion
        $priorityStmt = $db->prepare('INSERT OR IGNORE INTO task_priority (name) VALUES (:priorityName)');
        $priorityStmt->bindValue(':priorityName', $form_data['priorityName'], SQLITE3_TEXT);

        // Execute priority insertion statement
        if (!$priorityStmt->execute()) {
            throw new Exception('Failed to execute priority statement');
        }

        // Get the priority ID (either newly inserted or existing)
        $priorityId = $db->lastInsertRowID();

        // Prepare SQL statement for task insertion
        $taskStmt = $db->prepare('INSERT INTO task (description, date_created, due_date, task_priority_id, sort_order, task_status_id, clockify_project_id, clockify_task_id, clockify_workspace_id) VALUES (:description, :date_created, :due_date, :priorityId, :sort_order, :task_status_id, :clockify_project_id, :clockify_task_id, :clockify_workspace_id)');
        $taskStmt->bindValue(':description', $form_data['description'], SQLITE3_TEXT);
        $taskStmt->bindValue(':date_created', $form_data['date_created'], SQLITE3_TEXT);
        $taskStmt->bindValue(':due_date', $form_data['due_date'], SQLITE3_TEXT);
        $taskStmt->bindValue(':priorityId', $priorityId, SQLITE3_INTEGER);
        $taskStmt->bindValue(':sort_order', $form_data['sort_order'], SQLITE3_INTEGER);
        $taskStmt->bindValue(':task_status_id', $form_data['task_status_id'], SQLITE3_INTEGER);
        $taskStmt->bindValue(':clockify_project_id', $form_data['clockify_project_id'], SQLITE3_TEXT);
        $taskStmt->bindValue(':clockify_task_id', $form_data['clockify_task_id'], SQLITE3_TEXT);
        $taskStmt->bindValue(':clockify_workspace_id', $form_data['clockify_workspace_id'], SQLITE3_TEXT);

        // Execute the task insertion statement
        if (!$taskStmt->execute()) {
            throw new Exception('Failed to execute task statement');
        }

        // Fetch updated list of tasks
        $tasks = fetchTasks($db);

        // Send success response
        echo json_encode(['status' => 'success', 'message' => 'Task added successfully', 'data' => $tasks]);
    } catch (Exception $e) {
        // Send error response
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    } finally {
        // Close database connection
        if (isset($db)) {
            $db->close();
        }
    }
    exit;
}

// Handle GET requests to fetch tasks
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        // Connect to the database
        $db = connectDatabase();

        // Fetch tasks
        $tasks = fetchTasks($db);

        // Send success response
        echo json_encode(['status' => 'success', 'data' => $tasks]);
    } catch (Exception $e) {
        // Send error response
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    } finally {
        // Close database connection
        if (isset($db)) {
            $db->close();
        }
    }
    exit;
}

