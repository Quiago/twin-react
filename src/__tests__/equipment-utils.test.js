// src/__tests__/equipment-utils.test.js
import { describe, expect, it } from 'vitest';
import { classifyEquipment, findMeaningfulGroup, getSensorsForType } from '../utils/equipment-utils';

describe('Equipment Utils', () => {
    describe('classifyEquipment', () => {
        it('should classify analyzer correctly', () => {
            expect(classifyEquipment('Analyzer_10')).toBe('analyzer');
            expect(classifyEquipment('Mass_Analyzer')).toBe('analyzer');
        });

        it('should classify centrifuge correctly', () => {
            expect(classifyEquipment('Centrifuge_01')).toBe('centrifuge');
            expect(classifyEquipment('LabDemoCentrifuge_1811')).toBe('centrifuge');
        });

        it('should classify robot correctly', () => {
            expect(classifyEquipment('Cartesian_Robot')).toBe('robot');
            expect(classifyEquipment('cartesian_arm')).toBe('robot');
        });

        it('should return unknown for unrecognized equipment', () => {
            expect(classifyEquipment('Mystery_Device')).toBe('unknown');
            expect(classifyEquipment('Cupboard__4_378')).toBe('unknown');
        });

        it('should handle empty or invalid names', () => {
            expect(classifyEquipment('')).toBe('unknown');
            expect(classifyEquipment('geo_123')).toBe('unknown');
        });
    });

    describe('getSensorsForType', () => {
        it('should return sensors for analyzer', () => {
            const sensors = getSensorsForType('analyzer');
            expect(sensors).toBeInstanceOf(Array);
            expect(sensors.some(s => s.id === 'temp')).toBe(true);
            expect(sensors.some(s => s.id === 'ph')).toBe(true);
            expect(sensors.length).toBeGreaterThan(0);
        });

        it('should return sensors for centrifuge', () => {
            const sensors = getSensorsForType('centrifuge');
            expect(sensors.some(s => s.id === 'vibration')).toBe(true);
            expect(sensors.some(s => s.id === 'rpm')).toBe(true);
        });

        it('should return default sensor for unknown type', () => {
            const sensors = getSensorsForType('unknown');
            expect(sensors).toHaveLength(1);
            expect(sensors[0].id).toBe('temp');
            expect(sensors[0].name).toBe('Temperature');
        });
    });

    describe('findMeaningfulGroup', () => {
        it('should return object if it has meaningful name', () => {
            const obj = {
                name: 'Analyzer_10',
                parent: null,
                type: 'Mesh'
            };
            expect(findMeaningfulGroup(obj)).toBe(obj);
        });

        it('should traverse up to find meaningful parent', () => {
            const grandparent = {
                name: 'Centrifuge_Main',
                parent: null
            };
            const parent = {
                name: 'geo_base',
                parent: grandparent
            };
            const child = {
                name: 'Mesh_001',
                parent
            };

            expect(findMeaningfulGroup(child)).toBe(grandparent);
        });

        it('should stop at scene root', () => {
            const scene = {
                name: 'Scene',
                type: 'Scene',
                parent: null
            };
            const obj = {
                name: 'Object_1',
                parent: scene
            };

            // Should return the object itself since parent is Scene
            expect(findMeaningfulGroup(obj)).toBe(obj);
        });
    });
});
