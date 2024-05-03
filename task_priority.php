<?php
// Function to connect to the SQLite database
function connectDatabase(): SQLite3 {
    $db = new SQLite3('Datasave.sqlite');
    if (!$db) {
        throw new Exception("Failed to connect to the database");
    }
    return $db;
}

// Handle POST requests
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Process JSON input
    $json_data = file_get_contents('php://input');
    if (empty($json_data)) {
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

        // Extract task ID and priority ID from the request data
        $taskId = $form_data['taskId'];
        $priorityId = $form_data['priorityId'];

        // Prepare SQL statement to update task priority
        $stmt = $db->prepare('UPDATE task SET task_priority_id = :priorityId WHERE clockify_task_id = :taskId');
        $stmt->bindParam(':priorityId', $priorityId, SQLITE3_INTEGER);
        $stmt->bindParam(':taskId', $taskId, SQLITE3_INTEGER);


        // Execute the SQL statement
        if (!$stmt->execute()) {
            error_log($stmt->queryString);

            throw new Exception('Failed to update task priority: ' . $db->lastErrorMsg());
        }

        // Send success response
        echo json_encode(['status' => 'success', 'message' => 'Task priority updated successfully']);
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
