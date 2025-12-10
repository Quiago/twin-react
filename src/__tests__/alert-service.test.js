// src/__tests__/alert-service.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processAlertAction, sendEmailAlert, sendWhatsApp } from '../services/alert-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('Alert Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set mock mode to true for tests
        vi.stubEnv('VITE_NOTIFICATION_MOCK_MODE', 'true');
    });

    describe('sendEmailAlert', () => {
        it('should return mock response in mock mode', async () => {
            const result = await sendEmailAlert('test@test.com', 'Test Subject', 'Test body');
            expect(result.mock).toBe(true);
            expect(result.success).toBe(true);
        });
    });

    describe('sendWhatsApp', () => {
        it('should return mock response in mock mode', async () => {
            const result = await sendWhatsApp('+1234567890', 'Test message');
            expect(result.mock).toBe(true);
            expect(result.success).toBe(true);
        });
    });

    describe('processAlertAction', () => {
        it('should send email when email configured', async () => {
            const alert = {
                equipment: 'Analyzer_10',
                sensor: 'temperature',
                value: 85,
                threshold: 80,
                severity: 'warning',
            };

            const actionConfig = {
                email: 'alert@test.com',
                severity: 'warning',
            };

            const results = await processAlertAction(alert, actionConfig);

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('email');
            expect(results[0].success).toBe(true);
        });

        it('should send whatsapp when phone configured', async () => {
            const alert = {
                equipment: 'Centrifuge_01',
                sensor: 'vibration',
                value: 5.2,
                threshold: 3.0,
                severity: 'critical',
            };

            const actionConfig = {
                phone_number: '+1234567890',
                severity: 'critical',
            };

            const results = await processAlertAction(alert, actionConfig);

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('whatsapp');
            expect(results[0].success).toBe(true);
        });

        it('should send both when both configured', async () => {
            const alert = {
                equipment: 'Robot_Arm',
                sensor: 'position_error',
                value: 15,
                threshold: 10,
                severity: 'warning',
            };

            const actionConfig = {
                email: 'test@test.com',
                phone_number: '+1234567890',
                severity: 'warning',
            };

            const results = await processAlertAction(alert, actionConfig);

            expect(results).toHaveLength(2);
            expect(results.some(r => r.type === 'email')).toBe(true);
            expect(results.some(r => r.type === 'whatsapp')).toBe(true);
        });
    });
});
