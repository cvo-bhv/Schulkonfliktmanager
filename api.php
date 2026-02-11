<?php
// Erlaubt Anfragen von überall (für Entwicklung wichtig, später einschränken)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Preflight-Anfragen beantworten
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --------------------------------------------------------
// DATENBANK KONFIGURATION
// --------------------------------------------------------
$host = '10.35.249.159'; // Host ohne Port
$port = '3306';          // Port separat
$db_name = 'k347988_verwaltung';
$username = 'k347988_spm';
$password = 'kuchaj-8hinkI-vupkuj';
// --------------------------------------------------------

try {
    // DSN String korrekt zusammenbauen (host=...;port=...;dbname=...)
    $dsn = "mysql:host=$host;port=$port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$type = isset($_GET['type']) ? $_GET['type'] : '';
$id = isset($_GET['id']) ? $_GET['id'] : '';

// Erlaubte Tabellen (Sicherheits-Whitelist)
$tables = [
    'years' => 'years',
    'classes' => 'classes',
    'students' => 'students',
    'incidents' => 'incidents'
];

if (!array_key_exists($type, $tables)) {
    echo json_encode(["error" => "Ungültiger Typ: " . $type]);
    exit();
}

$table = $tables[$type];

try {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Booleans konvertieren für JS
            if ($result && $type === 'incidents') {
                $result['parentContacted'] = (bool)$result['parentContacted'];
                $result['socialServiceContacted'] = (bool)$result['socialServiceContacted'];
                $result['administrationContacted'] = (bool)$result['administrationContacted'];
                $result['createdAt'] = (int)$result['createdAt'];
            }
            
            echo json_encode($result ?: null);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM `$table`");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Booleans konvertieren für JS
            if ($type === 'incidents') {
                foreach ($results as &$row) {
                    $row['parentContacted'] = (bool)$row['parentContacted'];
                    $row['socialServiceContacted'] = (bool)$row['socialServiceContacted'];
                    $row['administrationContacted'] = (bool)$row['administrationContacted'];
                    $row['createdAt'] = (int)$row['createdAt'];
                }
            }
            echo json_encode($results);
        }
    } 
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) {
            throw new Exception("Keine Daten empfangen");
        }

        // JS Booleans (true/false) in MySQL TinyInt (1/0) umwandeln
        foreach ($input as $key => $value) {
            if (is_bool($value)) {
                $input[$key] = $value ? 1 : 0;
            }
        }

        $columns = array_keys($input);
        
        // Prüfen ob Update oder Insert
        $checkId = $input['id'] ?? null;
        $exists = false;
        
        if ($checkId) {
            $stmt = $pdo->prepare("SELECT id FROM `$table` WHERE id = ?");
            $stmt->execute([$checkId]);
            if ($stmt->fetch()) {
                $exists = true;
            }
        }

        if ($exists) {
            // UPDATE
            // Erstelle "col1 = :col1, col2 = :col2" String
            $setClause = implode(", ", array_map(function($col) { return "`$col` = :$col"; }, $columns));
            $sql = "UPDATE `$table` SET $setClause WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($input); // PDO ordnet Array-Keys den :placeholdern zu
            echo json_encode(["status" => "updated", "id" => $input['id']]);
        } else {
            // INSERT
            $colString = "`" . implode("`, `", $columns) . "`";
            $valString = ":" . implode(", :", $columns);
            $sql = "INSERT INTO `$table` ($colString) VALUES ($valString)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($input);
            echo json_encode(["status" => "created", "id" => $input['id']]);
        }
    } 
    elseif ($method === 'DELETE') {
        if (!$id) {
            throw new Exception("ID für Löschvorgang fehlt");
        }
        $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "deleted"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Serverfehler: " . $e->getMessage()]);
}
?>