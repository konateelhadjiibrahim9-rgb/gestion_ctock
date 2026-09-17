<?php
// Script PHP pour exécuter le script SQL d'ajout de colonne image_url
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'gestion_stock';

try {
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        die("Erreur de connexion: " . $conn->connect_error);
    }
    
    // Vérifier si la colonne existe déjà
    $checkColumn = $conn->query("SHOW COLUMNS FROM produits LIKE 'image_url'");
    
    if ($checkColumn->num_rows > 0) {
        echo "La colonne 'image_url' existe déjà dans la table produits.";
    } else {
        // Ajouter la colonne
        $sql = "ALTER TABLE produits ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER description";
        
        if ($conn->query($sql) === TRUE) {
            echo "Colonne 'image_url' ajoutée avec succès à la table produits.";
        } else {
            echo "Erreur lors de l'ajout de la colonne: " . $conn->error;
        }
    }
    
    // Vérifier la structure de la table
    echo "<br><br>Structure actuelle de la table produits:<br>";
    $result = $conn->query("DESCRIBE produits");
    
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