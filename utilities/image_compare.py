import sys
import cv2
from ultralytics import YOLO
from skimage.metrics import structural_similarity as ssim
import json
# 1. Charger un modèle YOLO pré-entraîné
model = YOLO("yolov8m.pt")  # Essayez avec un modèle plus grand si nécessaire

# 2. Fonction pour détecter le véhicule principal dans une image
def detect_main_vehicle(image, debug_filename=None):
    # Vérification du format de l'image
    if image is None:
        print("Erreur de chargement d'image")
        return {
            "similarity": None,
            "error": "Erreur de chargement d'image",
            "message": "Une ou les deux images n'ont pas pu être chargées."
        }

    # Redimensionner l'image pour correspondre à la taille attendue par YOLO
    image_resized = cv2.resize(image, (640, 640))

    # Effectuer la détection avec YOLO
    results = model(image_resized, conf=0.2, verbose=False)[0]  # Confusion réduite
    names = results.names
    boxes = results.boxes
    classes = boxes.cls.cpu().numpy() if boxes.cls is not None else []

    if len(classes) == 0:
        print("Aucun véhicule détecté")
        return None

    # Filtrage des véhicules détectés
    VEHICLE_CLASSES = ["car", "truck", "bus", "motorcycle"]
    vehicle_boxes = []
    for i, cls in enumerate(classes):
        class_name = names.get(int(cls), "")
        if class_name in VEHICLE_CLASSES:
            x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
            area = (x2 - x1) * (y2 - y1)
            vehicle_boxes.append(((x1, y1, x2, y2), area))

    if not vehicle_boxes:
        print("Aucun véhicule détecté dans les boîtes")
        return None

    # Dessiner les boîtes englobantes pour débogage
    for box in vehicle_boxes:
        x1, y1, x2, y2 = box[0]
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # Sauvegarde de l'image avec détection (si demandé)
    if debug_filename:
        cv2.imwrite(debug_filename, image)

    # Retourner la zone du véhicule la plus grande détectée
    largest_box, _ = max(vehicle_boxes, key=lambda b: b[1])
    x1, y1, x2, y2 = largest_box
    cropped = image[y1:y2, x1:x2]

    return cropped

# 3. Fonction pour calculer la similarité entre deux images
def calculate_similarity(imageA, imageB):
    # Redimensionner les images pour avoir les mêmes dimensions
    height, width = imageA.shape[:2]
    imageB_resized = cv2.resize(imageB, (width, height))

    # Conversion des images en niveaux de gris
    grayA = cv2.cvtColor(imageA, cv2.COLOR_BGR2GRAY)
    grayB = cv2.cvtColor(imageB_resized, cv2.COLOR_BGR2GRAY)

    # Comparaison structurelle (SSIM)
    similarity_index, _ = ssim(grayA, grayB, full=True)

    return similarity_index

# 4. Fonction principale pour comparer les images
def compare_images(image_path_1, image_path_2):
    # Charger les images
    imageA = cv2.imread(image_path_1)
    imageB = cv2.imread(image_path_2)

    # Détecter les véhicules principaux dans les deux images
    croppedA = detect_main_vehicle(imageA, debug_filename="debug_imageA.jpg")
    croppedB = detect_main_vehicle(imageB, debug_filename="debug_imageB.jpg")

    if croppedA is None or croppedB is None:
        return {
            "similarity": 0,
            "error": "Objet non détecté",
            "message": "Aucun véhicule détecté dans une ou les deux images."
        }

    # Calculer la similarité entre les deux images découpées
    similarity = calculate_similarity(croppedA, croppedB)

    return {
        "similarity": similarity,
        "message": "Les images ont été comparées avec succès."
    }

# 5. Exécution depuis la ligne de commande
if __name__ == "__main__":
    img1_path = sys.argv[1]  # Le premier chemin d'image passé en argument
    img2_path = sys.argv[2]  # Le deuxième chemin d'image passé en argument

    result = compare_images(img1_path, img2_path)

    # Retourner le résultat sous forme JSON
    print(json.dumps(result))
