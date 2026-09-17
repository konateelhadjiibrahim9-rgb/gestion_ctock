<?php
// Script PHP pour vérifier la structure de la table mouvements_stock
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'gestion_stock';

try {
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        die("Erreur de connexion: " . $conn->connect_error);
    }
    
    echo "Structure de la table mouvements_stock:<br>";
    $result = $conn->query("DESCRIBE mouvements_stock");
    
    if ($result->num_rows > 0) {
        echo "<table border='1'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
        
        while($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row["Field"] . "</td>";
            echo "<td>" . $row["Type"] . "</td>";
            echo "<td>" . $row["Null"] . "</td>";
            echo "<td>" . $row["Key"] . "</td>";
            echo "<td>" . $row["Default"] . "</td>";
            echo "<td>" . $row["Extra"] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>