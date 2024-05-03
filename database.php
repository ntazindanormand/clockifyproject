<?php
// Function to connect to the SQLite database
function connectDatabase(): SQLite3 {
    return new SQLite3('Datasave.sqlite');
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
    $query = "SELECT name FROM projects WHERE id = $projectId";
    $result = $db->querySingle($query);
    return $result ?: 'Unknown Project';
}
// Function to update task status
function updateTaskStatus($db, $taskId, $statusId, $statusName): bool {
    try {
        // Prepare SQL statement to update task status ID and name
        $stmt = $db->prepare('UPDATE task 
                              SET task_status_id = :statusId 
                              WHERE clockify_task_id = :taskId');

        if (!$stmt) {
            throw new Exception('Failed to prepare statement to update task status');
        }

        // Bind parameters
        $stmt->bindParam(':statusId', $statusId);
        $stmt->bindParam(':taskId', $taskId);

        // Execute statement to update task_status_id
        if (!$stmt->execute()) {
            throw new Exception('Failed to execute statement to update task status');
        } else {
            // Log success message
            error_log('Task status updated successfully');
        }

        // If statusName is provided and not empty, update task_status name directly
        if ($statusName !== null && !empty($statusName)) {
            // Prepare SQL statement to update task status name directly
            $updateStatusNameStmt = $db->prepare('UPDATE task_status 
                                        SET name = :statusName 
                                        WHERE id = :statusId');

            if (!$updateStatusNameStmt) {
                throw new Exception('Failed to prepare statement to update task status name');
            }

            // Bind parameters
            $updateStatusNameStmt->bindParam(':statusName', $statusName);
            $updateStatusNameStmt->bindParam(':statusId', $statusId);

            // Execute statement to update task_status name directly
            if (!$updateStatusNameStmt->execute()) {
                throw new Exception('Failed to execute statement to update task status name');
            } else {
                // Log success message
                error_log('Task status name updated successfully');
            }
        }

        return true; // Success
    } catch (Exception $e) {
        // Log the error
        error_log('Error updating task status: ' . $e->getMessage());
        return false; // Failure
    }
}

// Function to update task priority
function updateTaskPriority($db, $taskId, $priorityId, $priorityName, $projectId, $description): bool {
    try {
        // Log the Task ID to be updated
        error_log('Task ID to be updated: ' . $taskId);

        // Prepare SQL statement to update task priority ID and name
        $stmt = $db->prepare('UPDATE task 
                              SET task_priority_id = :priorityId 
                              WHERE clockify_task_id = :taskId 
                              AND clockify_project_id = :projectId 
                              AND description = :description');

        if (!$stmt) {
            throw new Exception('Failed to prepare statement to update task priority');
        }

        // Bind parameters
        $stmt->bindParam(':priorityId', $priorityId);
        $stmt->bindParam(':taskId', $taskId);
        $stmt->bindParam(':projectId', $projectId);
        $stmt->bindParam(':description', $description);

        // Execute statement to update task_priority_id
        if (!$stmt->execute()) {
            throw new Exception('Failed to execute statement to update task priority ID');
        } else {
            // Log success message
            error_log('Task priority ID updated successfully');
        }

        // If priorityName is provided, update task priority name directly
        if ($priorityName !== null) {
            // Prepare SQL statement to update task priority name directly
            $updatePriorityNameStmt = $db->prepare('UPDATE task_priority 
                                        SET name = :priorityName 
                                        WHERE id = (SELECT task_priority_id FROM task WHERE clockify_task_id = :taskId)');

            if (!$updatePriorityNameStmt) {
                throw new Exception('Failed to prepare statement to update task priority name');
            }

            // Bind parameters
            $updatePriorityNameStmt->bindParam(':priorityName', $priorityName);
            $updatePriorityNameStmt->bindParam(':taskId', $taskId);

            // Execute statement to update task_priority name directly
            if (!$updatePriorityNameStmt->execute()) {
                throw new Exception('Failed to execute statement to update task priority name');
            } else {
                // Log success message
                error_log('Task priority name updated successfully');
            }
        }

        return true; // Success
    } catch (Exception $e) {
        // Log the error
        error_log('Error updating task priority: ' . $e->getMessage());
        return false; // Failure
    }
}
// Handle POST requests
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

        if (isset($form_data['taskId']) && isset($form_data['statusId']) && isset($form_data['statusName'])) {
            // Update task status
            $taskId = $form_data['taskId'];
            $statusId = $form_data['statusId'];
            $statusName = $form_data['statusName'];

            // Log received data
            error_log('Received Task ID: ' . $taskId);
            error_log('Received Status ID: ' . $statusId);
            error_log('Received Status Name: ' . $statusName);

            // Update task status
            if (updateTaskStatus($db, $taskId, $statusId, $statusName)) {
                // Send success response
                echo json_encode(['status' => 'success', 'message' => 'Task status updated successfully']);
            } else {
                throw new Exception('Failed to update task status');
            }
        } elseif (isset($form_data['taskId']) && isset($form_data['priorityId']) && isset($form_data['projectId']) && isset($form_data['description']) && isset($form_data['priorityName'])) {
            // Update task priority
            $taskId = $form_data['taskId'];
            $priorityId = $form_data['priorityId'];
            $projectId = $form_data['projectId'];
            $description = $form_data['description'];
            $priorityName = $form_data['priorityName'];

            // Log received data
            error_log('Received Task ID: ' . $taskId);
            error_log('Received Priority ID: ' . $priorityId);
            error_log('Received Project ID: ' . $projectId);
            error_log('Received Description: ' . $description);
            error_log('Received priorityName: ' .$priorityName);

            // Update task priority
            if (updateTaskPriority($db, $taskId, $priorityId, $priorityName, $projectId, $description)) {
                // Send success response
                echo json_encode(['status' => 'success', 'message' => 'Task priority updated successfully']);
            } else {
                throw new Exception('Failed to update task priority');
            }
        } else {
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
            $taskStmt->bindValue(4, $form_data['task_priority_id']);
            $taskStmt->bindValue(5, $form_data['created_by']);
            $taskStmt->bindValue(6, $form_data['assigned_to']);
            $taskStmt->bindValue(7, $newSortOrder);
            $taskStmt->bindValue(8, $form_data['task_status_id']);
            $taskStmt->bindValue(9, $form_data['clockify_project_id']);
            $taskStmt->bindValue(10, $form_data['clockify_task_id']);
            $taskStmt->bindValue(11, $form_data['clockify_workspace_id']);

            // Execute the task insertion statement
            if (!$taskStmt->execute()) {
                throw new Exception('Failed to execute task statement');
            }

            // Fetch the last inserted row ID
            $taskId = $db->lastInsertRowID();

            // Check if task status exists
            $statusId = $form_data['task_status_id'];
            $checkStatusStmt = $db->prepare('SELECT id FROM task_status WHERE id = :statusId');
            if (!$checkStatusStmt) {
                throw new Exception('Failed to prepare statement to check task status existence');
            }
            $checkStatusStmt->bindParam(':statusId', $statusId);
            $result = $checkStatusStmt->execute();
            $statusExists = false;

            // Fetch the result as an associative array
            $row = $result->fetchArray(SQLITE3_ASSOC);

            // If $row is not null, then the status exists
            if ($row !== false) {
                $statusExists = true;
            }

            // If the status doesn't exist, insert it with a null name
            if (!$statusExists) {
                $insertStatusStmt = $db->prepare('INSERT INTO task_status (id, name) VALUES (:statusId, :statusName)');
                if (!$insertStatusStmt) {
                    throw new Exception('Failed to prepare statement to insert task status');
                }
                $insertStatusStmt->bindParam(':statusId', $statusId);
                $insertStatusStmt->bindParam(':statusName', $form_data['statusName']);
                if (!$insertStatusStmt->execute()) {
                    throw new Exception('Failed to insert task status');
                }
            }

            // Check if task priority exists
            $priorityId = $form_data['task_priority_id'];
            $checkPriorityStmt = $db->prepare('SELECT id FROM task_priority WHERE id = :priorityId');
            if (!$checkPriorityStmt) {
                throw new Exception('Failed to prepare statement to check priority existence');
            }
            $checkPriorityStmt->bindParam(':priorityId', $priorityId);
            $result = $checkPriorityStmt->execute();
            $priorityExists = false;

            // Fetch the result as an associative array
            $row = $result->fetchArray(SQLITE3_ASSOC);

            // If $row is not null, then the priority exists
            if ($row !== false) {
                $priorityExists = true;
            }

            // If the priority doesn't exist, insert it with a null name
            if (!$priorityExists) {
                $insertPriorityStmt = $db->prepare('INSERT INTO task_priority (id, name) VALUES (:priorityId, :priorityName)');
                if (!$insertPriorityStmt) {
                    throw new Exception('Failed to prepare statement to insert priority');
                }
                $insertPriorityStmt->bindParam(':priorityId', $priorityId);
                $insertPriorityStmt->bindParam(':priorityName', $form_data['priorityName']);
                if (!$insertPriorityStmt->execute()) {
                    throw new Exception('Failed to insert priority');
                }
            }

            // Fetch updated list of tasks
            $tasks = fetchTasks($db);

            // Send success response
            echo json_encode(['status' => 'success', 'message' => 'Task added successfully', 'data' => $tasks]);
        }
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