import * as THREE from 'three';

// Constants matching the Python classifier
const PATTERNS = {
    'analyzer': 'analyzer',
    'cartesian': 'robot',
    'centrifuge': 'centrifuge',
    'storage': 'storage',
    'conveyor': 'conveyor',
    'mixer': 'mixer',
    'pump': 'pump'
};

const JUNK_NAMES = ['geo_', 'Object_', 'root', 'Scene', 'Tube', 'Node', 'Mesh', 'default'];

/**
 * Classify equipment type based on name pattern
 * @param {string} name 
 * @returns {string} equipment type or 'unknown'
 */
export function classifyEquipment(name) {
    const nameLower = name.toLowerCase();

    for (const [pattern, type] of Object.entries(PATTERNS)) {
        if (nameLower.includes(pattern)) {
            return type;
        }
    }

    return 'unknown';
}

/**
 * Get sensor definitions for equipment type (ported from Python)
 * @param {string} type 
 * @returns {Array} List of sensor definitions
 */
export function getSensorsForType(type) {
    const sensorDb = {
        'analyzer': [
            { id: 'temp', name: 'Temperature', unit: '°C', range: [15, 30] },
            { id: 'ph', name: 'pH Level', unit: 'pH', range: [6.5, 7.5] },
            { id: 'turbidity', name: 'Turbidity', unit: 'NTU', range: [0, 5] }
        ],
        'robot': [
            { id: 'x_pos', name: 'X Position', unit: 'mm', range: [0, 2000] },
            { id: 'y_pos', name: 'Y Position', unit: 'mm', range: [0, 1500] },
            { id: 'vibration', name: 'Vibration', unit: 'mm/s', range: [0, 5] },
            { id: 'current', name: 'Motor Current', unit: 'A', range: [0.5, 2.0] }
        ],
        'centrifuge': [
            { id: 'rpm', name: 'RPM', unit: 'RPM', range: [3000, 5000] },
            { id: 'vibration', name: 'Vibration', unit: 'mm/s', range: [0, 3] },
            { id: 'temp', name: 'Temperature', unit: '°C', range: [20, 35] }
        ],
        'storage': [
            { id: 'level', name: 'Fill Level', unit: '%', range: [20, 90] },
            { id: 'temp', name: 'Temperature', unit: '°C', range: [15, 25] },
            { id: 'humidity', name: 'Humidity', unit: '%RH', range: [30, 60] }
        ],
        'conveyor': [
            { id: 'speed', name: 'Belt Speed', unit: 'm/min', range: [5, 30] },
            { id: 'current', name: 'Motor Current', unit: 'A', range: [1, 3] },
            { id: 'vibration', name: 'Vibration', unit: 'mm/s', range: [0, 2] }
        ]
    };

    return sensorDb[type] || [
        { id: 'temp', name: 'Temperature', unit: '°C', range: [0, 100] }
    ];
}

/**
 * Find the most meaningful parent group for a clicked object
 * @param {THREE.Object3D} obj 
 * @returns {THREE.Object3D} The meaningful group or the object itself
 */
export function findMeaningfulGroup(obj) {
    if (!obj.parent || obj.parent.type === 'Scene') return obj;

    // Check if the current object name contains any "junk" strings
    const isJunk = JUNK_NAMES.some(junk => obj.name.includes(junk));

    // If it's NOT junk and has a substantial name, it might be our target
    // Also checking if it has children might be a good heuristic for "Group"
    if (!isJunk && obj.name.length > 2) {
        return obj;
    }

    return findMeaningfulGroup(obj.parent);
}

/**
 * Recursively set an emissive flash color on a group
 * @param {THREE.Object3D} group 
 * @param {string} colorHex e.g., 0xff0000
 */
export function flashGroup(group, colorHex = 0xffaa00) {
    group.traverse((child) => {
        if (child.isMesh && child.material) {
            // Clone material to avoid affecting other instances sharing it
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = child.material;
            }

            const flashMaterial = child.userData.originalMaterial.clone();
            flashMaterial.emissive.setHex(colorHex);
            flashMaterial.emissiveIntensity = 0.5; // Make it glow
            // Blend with base color if needed, or just set emmissive

            child.material = flashMaterial;
        }
    });

    // Return a restoration function
    return () => {
        group.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material.dispose(); // Cleanup clone
                child.material = child.userData.originalMaterial;
                delete child.userData.originalMaterial;
            }
        });
    };
}
