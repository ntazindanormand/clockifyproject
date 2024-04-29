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
function fetchTasks($db): array {
    $query = 'SELECT t.*, 
                     tp.name AS priority_name, 
                     ts.name AS status_name
              FROM task t 
              LEFT JOIN task_priority tp ON t.task_priority_id = tp.id
              LEFT JOIN task_status ts ON t.task_status_id = ts.id
              ORDER BY t.date_created DESC';

    $result = $db->query($query);
    if (!$result) {
        throw new Exception("Database query failed: " . $db->lastErrorMsg());
    }

    $tasks = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $row['project_name'] = getProjectName($row['clockify_project_id'], $db);
        $tasks[] = $row;
    }
    return $tasks;
}

// Function to retrieve project name based on project ID
function getProjectName($projectId, $db) {
    $query = "SELECT name FROM projects WHERE id = $projectId";  // Adjust table and column names as necessary
    $result = $db->querySingle($query);
    return $result ? $result : 'Unknown Project';
}

// Function to update sort order of tasks
function updateSortOrder($db, $tasks) {
    try {
        foreach ($tasks as $index => $task) {
            $taskId = $task['task']; // Get task ID
            $sortOrder = $index + 1; // Calculate new sort order
            $stmt = $db->prepare('UPDATE task SET sort_order = :sortOrder WHERE id = :taskId');
            $stmt->bindParam(':sortOrder', $sortOrder, SQLITE3_INTEGER);
            $stmt->bindParam(':taskId', $taskId, SQLITE3_INTEGER);
            if (!$stmt->execute()) {
                throw new Exception('Failed to update sort order for task ID: ' . $taskId);
            }
        }
    } catch (Exception $e) {
        throw new Exception('Error updating sort order: ' . $e->getMessage());
    }
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
        $priorityStmt = $db->prepare('INSERT OR IGNORE INTO task_priority (name) VALUES (?)');
        if (!$priorityStmt) {
            throw new Exception('Failed to prepare priority statement');
        }

        // Update sort order if applicable
        if (isset($form_data['sort_order'])) {
            updateSortOrder($db, $form_data['sort_order']);
        }

        // If UserId is not defined, use created_by value from form data
        $UserId = isset($form_data['UserId']) ? $form_data['UserId'] : $form_data['created_by'];

        // Bind parameter for priority insertion
        $priorityStmt->bindValue(1, $form_data['priorityName']);

        // Execute priority insertion statement
        if (!$priorityStmt->execute()) {
            throw new Exception('Failed to execute priority statement');
        }

        // Get the priority ID (either newly inserted or existing)
        $priorityId = $db->lastInsertRowID();
// Prepare SQL statement for task insertion
        $taskStmt = $db->prepare('INSERT INTO task (description, date_created, due_date, task_priority_id, created_by, assigned_to, sort_order, task_status_id, clockify_project_id, clockify_task_id, clockify_workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        if (!$taskStmt) {
            throw new Exception('Failed to prepare task statement');
        }

// Count existing tasks to determine sort order for the new task
        $existingTasksCount = $db->querySingle('SELECT COUNT(*) FROM task');
        $newSortOrder = $existingTasksCount + 1; // Increment by 1 for the new task

// Bind parameters for task insertion
        $taskStmt->bindValue(1, $form_data['description']);
        $taskStmt->bindValue(2, $form_data['date_created']);
        $taskStmt->bindValue(3, $form_data['due_date']);
        $taskStmt->bindValue(4, $priorityId); // Use the priority ID
        $taskStmt->bindValue(5, $form_data['created_by']);
        $taskStmt->bindValue(6, $form_data['assigned_to']);
        $taskStmt->bindValue(7, $newSortOrder); // Use the new sort order
        $taskStmt->bindValue(8, $form_data['task_status_id']);
        $taskStmt->bindValue(9, $form_data['clockify_project_id']);
        $taskStmt->bindValue(10, $form_data['clockify_task_id']);
        $taskStmt->bindValue(11, $form_data['clockify_workspace_id']);

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
