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
                                ts.name AS status_name, 
                                u1.username AS created_by_username,
                                u2.username AS assigned_to_username
                         FROM task t 
                         LEFT JOIN task_priority tp ON t.task_priority_id = tp.id
                         LEFT JOIN task_status ts ON t.task_status_id = ts.id
                         LEFT JOIN users u1 ON t.created_by = u1.id
                         LEFT JOIN users u2 ON t.assigned_to = u2.id
                         ORDER BY t.date_created DESC');
    $tasks = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        // Include both user IDs and usernames
        $row['created_by_id'] = $row['created_by'];
        $row['created_by'] = $row['created_by_username'];
        $row['assigned_to_id'] = $row['assigned_to'];
        $row['assigned_to'] = $row['assigned_to_username'];
        unset($row['created_by_username']); // Remove redundant fields
        unset($row['assigned_to_username']); // Remove redundant fields
        $tasks[] = $row;
    }
    return $tasks;
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

        // Prepare SQL statement
        $stmt = $db->prepare('INSERT INTO task (description, date_created, due_date, task_priority_id, created_by, assigned_to, sort_order, task_status_id, clockify_project_id, clockify_task_id, clockify_workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        if (!$stmt) {
            throw new Exception('Failed to prepare statement');
        }


        // Bind parameters
        $stmt->bindValue(1, $form_data['description']);
        $stmt->bindValue(2, $form_data['date_created']);
        $stmt->bindValue(3, $form_data['due_date']);
        $stmt->bindValue(4, $form_data['task_priority_id']);
        $stmt->bindValue(5, $form_data['created_by']);
        $stmt->bindValue(6, $form_data['assigned_to']);
        $stmt->bindValue(7, $form_data['sort_order']);
        $stmt->bindValue(8, $form_data['task_status_id']);
        $stmt->bindValue(9, $form_data['clockify_project_id']);
        $stmt->bindValue(10, $form_data['clockify_task_id']);
        $stmt->bindValue(11, $form_data['clockify_workspace_id']);

        // Execute the statement
        if (!$stmt->execute()) {
            throw new Exception('Failed to execute statement');
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
